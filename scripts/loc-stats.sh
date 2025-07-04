#!/bin/bash
# Local LOC statistics script

echo "📊 Git Lines of Code Statistics"
echo "==============================="
echo

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Function to format numbers with commas
format_number() {
    echo "$1" | sed ':a;s/\B[0-9]\{3\}\>/,&/;ta'
}

# Overall repository stats
echo "📈 Overall Repository Statistics:"
STATS=$(git log --pretty=tformat: --numstat | awk '{ add += $1; subs += $2; loc += $1 - $2 } END { printf "%d|%d|%d", add, subs, loc }')
IFS='|' read -r ADDITIONS DELETIONS NET <<< "$STATS"
echo "   Lines Added:    $(format_number $ADDITIONS)"
echo "   Lines Removed:  $(format_number $DELETIONS)"
echo "   Net Change:     $(format_number $NET)"
echo

# Your personal stats
AUTHOR=$(git config user.name)
echo "👤 Your Statistics ($AUTHOR):"
PERSONAL_STATS=$(git log --author="$AUTHOR" --pretty=tformat: --numstat | awk '{ add += $1; subs += $2; loc += $1 - $2 } END { printf "%d|%d|%d", add, subs, loc }')
IFS='|' read -r P_ADD P_DEL P_NET <<< "$PERSONAL_STATS"
echo "   Lines Added:    $(format_number $P_ADD)"
echo "   Lines Removed:  $(format_number $P_DEL)"
echo "   Net Change:     $(format_number $P_NET)"
COMMIT_COUNT=$(git log --author="$AUTHOR" --oneline | wc -l)
echo "   Total Commits:  $(format_number $COMMIT_COUNT)"
echo

# Last 30 days activity
echo "📅 Last 30 Days Activity:"
MONTHLY_STATS=$(git log --since="30 days ago" --pretty=tformat: --numstat | awk '{ add += $1; subs += $2 } END { printf "%d|%d", add, subs }')
IFS='|' read -r M_ADD M_DEL <<< "$MONTHLY_STATS"
echo "   Lines Added:    $(format_number $M_ADD)"
echo "   Lines Removed:  $(format_number $M_DEL)"
MONTHLY_COMMITS=$(git log --since="30 days ago" --oneline | wc -l)
echo "   Commits:        $(format_number $MONTHLY_COMMITS)"
echo

# Current branch vs main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "🌿 Current Branch ($CURRENT_BRANCH) vs Main:"
    if git rev-parse --verify main >/dev/null 2>&1; then
        BASE_BRANCH="main"
    elif git rev-parse --verify master >/dev/null 2>&1; then
        BASE_BRANCH="master"
    else
        BASE_BRANCH=""
    fi
    
    if [ -n "$BASE_BRANCH" ]; then
        BRANCH_STATS=$(git log $BASE_BRANCH..$CURRENT_BRANCH --pretty=tformat: --numstat 2>/dev/null | awk '{ add += $1; subs += $2 } END { printf "%d|%d", add, subs }')
        if [ -n "$BRANCH_STATS" ]; then
            IFS='|' read -r B_ADD B_DEL <<< "$BRANCH_STATS"
            echo "   Lines Added:    $(format_number $B_ADD)"
            echo "   Lines Removed:  $(format_number $B_DEL)"
            BRANCH_COMMITS=$(git log $BASE_BRANCH..$CURRENT_BRANCH --oneline 2>/dev/null | wc -l)
            echo "   Commits:        $(format_number $BRANCH_COMMITS)"
        else
            echo "   No changes yet"
        fi
    fi
    echo
fi

# Top 5 contributors
echo "🏆 Top 5 Contributors (by lines added):"
git log --pretty=format:"%an" | sort | uniq -c | sort -nr | head -5 | while read count author; do
    CONTRIBUTOR_STATS=$(git log --author="$author" --pretty=tformat: --numstat | awk '{ add += $1 } END { print add }')
    printf "   %-30s +%s lines\n" "$author" "$(format_number $CONTRIBUTOR_STATS)"
done
echo

# File type breakdown
echo "📁 Top File Types Changed:"
git log --pretty=tformat: --numstat | awk '{ 
    if ($3 ~ /\./) {
        split($3, a, "."); 
        ext = a[length(a)]; 
        if (ext !~ /^(lock|json|md)$/) {
            add[ext] += $1; 
            total[ext] += $1 + $2;
        }
    }
} 
END { 
    for (e in total) printf "%s|%d|%d\n", e, add[e], total[e] 
}' | sort -t'|' -k3 -nr | head -10 | while IFS='|' read -r ext adds total; do
    printf "   %-15s +%-10s lines (%-10s total changes)\n" ".$ext" "$(format_number $adds)" "$(format_number $total)"
done

echo
echo "💡 Tip: Run 'git log --author=\"\$(git config user.name)\" --oneline' to see your recent commits"