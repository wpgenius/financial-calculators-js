#!/usr/bin/env bash
# Decides whether this push to main makes a release, which version, and the
# release notes. Writes release=true|false and version=X.Y.Z to $GITHUB_OUTPUT
# and the notes to $RUNNER_TEMP/notes.md. Needs GH_TOKEN for the GitHub CLI.
set -euo pipefail

out=${GITHUB_OUTPUT:-/dev/stdout}
notes=${RUNNER_TEMP:-/tmp}/notes.md
repo=${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}

last=$(git tag --list 'v[0-9]*.[0-9]*.[0-9]*' --sort=-version:refname | head -1)
range=${last:+$last..}HEAD

# Only changes to the library itself release.
if [ -n "$last" ] && git diff --quiet "$last" HEAD -- src; then
	echo "src/ has not changed since $last: no release."
	echo "release=false" >> "$out"
	exit 0
fi
if [ -z "$(git ls-files src)" ]; then
	echo "No src/ yet: no release."
	echo "release=false" >> "$out"
	exit 0
fi

# Pull requests merged since the last release, from the squash commits' "(#N)".
prs=$(git log --format=%s "$range" | grep -oE '\(#[0-9]+\)$' | tr -dc '0-9\n' | sort -un || true)

bump=patch
lines=""
for pr in $prs; do
	info=$(gh api graphql -F owner="${repo%/*}" -F name="${repo#*/}" -F pr="$pr" -f query='
		query($owner: String!, $name: String!, $pr: Int!) {
			repository(owner: $owner, name: $name) {
				pullRequest(number: $pr) {
					title
					labels(first: 20) { nodes { name } }
					closingIssuesReferences(first: 50) { nodes { number title } }
				}
			}
		}' 2>/dev/null || true)
	[ -n "$info" ] || continue
	labels=$(jq -r '.data.repository.pullRequest.labels.nodes[].name' <<<"$info")
	if grep -qx 'release:major' <<<"$labels"; then bump=major
	elif grep -qx 'release:minor' <<<"$labels" && [ "$bump" != major ]; then bump=minor; fi
	issues=$(jq -r '.data.repository.pullRequest.closingIssuesReferences.nodes[] | "* \(.title) (#\(.number))"' <<<"$info")
	if [ -n "$issues" ]; then
		lines+="$issues"$'\n'
	else
		lines+="* $(jq -r '.data.repository.pullRequest.title' <<<"$info") (#$pr)"$'\n'
	fi
done

if [ -z "$last" ]; then
	version=1.0.0
	[ -n "$lines" ] || lines="* Initial release"$'\n'
else
	IFS=. read -r major minor patch <<<"${last#v}"
	case "$bump" in
		major) version="$((major + 1)).0.0" ;;
		minor) version="$major.$((minor + 1)).0" ;;
		*) version="$major.$minor.$((patch + 1))" ;;
	esac
	# A direct commit with no PR falls back to its commit message.
	[ -n "$lines" ] || lines=$(git log --format='* %s' "$range" -- src)$'\n'
fi

printf '%s' "$lines" | awk '!seen[$0]++' > "$notes"
echo "Release v$version"
cat "$notes"
{
	echo "release=true"
	echo "version=$version"
} >> "$out"
