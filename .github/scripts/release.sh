#!/usr/bin/env bash
# Prepares a release: the next version in package.json and its CHANGELOG.md
# section. The workflow then builds dist/, commits, tags and publishes.
#
# Usage: release.sh <bump>   (bump = patch | minor | major)
# Env:   DRY_RUN=1 prints the plan and changes nothing.
#        GH_TOKEN for the GitHub CLI (reads the merged PRs and closed issues).
# Output (to $GITHUB_OUTPUT when set): version, tag, notes_file.
set -euo pipefail

bump="${1:-patch}"
cd "$(git rev-parse --show-toplevel)"
repo=${GITHUB_REPOSITORY:-wpgenius/financial-calculators-js}

current="$(node -p "require('./package.json').version")"
IFS=. read -r major minor patch <<<"$current"
case "$bump" in
	major) major=$((major + 1)); minor=0; patch=0 ;;
	minor) minor=$((minor + 1)); patch=0 ;;
	*) patch=$((patch + 1)) ;;
esac
next="$major.$minor.$patch"
tag="v$next"
today="$(date -u +%Y-%m-%d)"
notes="$(mktemp)"

# Changelog lines: one per issue closed by the pull requests merged since the
# previous release (from the squash commits' "(#N)"), or the PR title when it
# closed none. A direct commit with no PR falls back to its subject.
range="HEAD"
git rev-parse -q --verify "v$current" >/dev/null && range="v$current..HEAD"
prs=$(git log --format=%s "$range" | grep -v '^Release v' | grep -oE '\(#[0-9]+\)$' | tr -dc '0-9\n' | sort -un || true)
: > "$notes.lines"
for pr in $prs; do
	info=$(gh api graphql -F owner="${repo%/*}" -F name="${repo#*/}" -F pr="$pr" -f query='
		query($owner: String!, $name: String!, $pr: Int!) {
			repository(owner: $owner, name: $name) {
				pullRequest(number: $pr) {
					title
					closingIssuesReferences(first: 50) { nodes { number title } }
				}
			}
		}' 2>/dev/null || true)
	[ -n "$info" ] || continue
	issues=$(jq -r '.data.repository.pullRequest.closingIssuesReferences.nodes[] | "- \(.title) (#\(.number))"' <<<"$info")
	if [ -n "$issues" ]; then
		echo "$issues" >> "$notes.lines"
	else
		echo "- $(jq -r '.data.repository.pullRequest.title' <<<"$info") (#$pr)" >> "$notes.lines"
	fi
done
if [ ! -s "$notes.lines" ]; then
	git log --no-merges --format='- %s' "$range" -- src | grep -v '^- Release v' > "$notes.lines" || true
fi
[ -s "$notes.lines" ] || echo '- Maintenance release.' > "$notes.lines"
{ echo '### Changes'; awk '!seen[$0]++' "$notes.lines"; } > "$notes"
rm -f "$notes.lines"

echo "Release $current -> $next ($bump)"
echo "--- notes ---"; cat "$notes"; echo "-------------"

if [ "${DRY_RUN:-}" != "1" ]; then
	npm version "$next" --no-git-tag-version --allow-same-version >/dev/null
	NEXT="$next" TODAY="$today" NOTES="$notes" node -e '
		const fs = require( "fs" );
		const notes = fs.readFileSync( process.env.NOTES, "utf8" ).trim();
		const section = "## " + process.env.NEXT + " – " + process.env.TODAY + "\n\n" + notes + "\n\n";
		const log = fs.readFileSync( "CHANGELOG.md", "utf8" );
		fs.writeFileSync( "CHANGELOG.md", log.replace( /^(# Changelog\n\n)/, "$1" + section ) );
	'
fi

if [ -n "${GITHUB_OUTPUT:-}" ]; then
	{ echo "version=$next"; echo "tag=$tag"; echo "notes_file=$notes"; } >> "$GITHUB_OUTPUT"
fi
