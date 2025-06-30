#!/bin/bash

# Roadmap Management Script
# Usage: ./scripts/roadmap.sh [edit|save|done]

ROADMAP_FILE="DEVELOPMENT_ROADMAP.md"
PRIVATE_BRANCH="private-docs"
PUBLIC_BRANCH="main"

case "$1" in
    "edit")
        echo "🔄 Switching to roadmap editing mode..."
        
        # Stash any uncommitted changes in main
        if [ "$(git status --porcelain)" ]; then
            echo "📦 Stashing current changes..."
            git stash push -m "Auto-stash before roadmap edit $(date)"
        fi
        
        # Switch to private branch
        git checkout $PRIVATE_BRANCH
        echo "✅ Ready to edit $ROADMAP_FILE"
        echo "💡 Run './scripts/roadmap.sh save \"your commit message\"' when done"
        ;;
        
    "save")
        # Check if we're on the right branch
        current_branch=$(git branch --show-current)
        if [ "$current_branch" != "$PRIVATE_BRANCH" ]; then
            echo "❌ Error: Not on $PRIVATE_BRANCH branch. Run 'roadmap edit' first."
            exit 1
        fi
        
        # Commit the roadmap changes
        commit_msg="${2:-Update roadmap $(date '+%Y-%m-%d %H:%M')}"
        git add $ROADMAP_FILE
        git commit -m "$commit_msg"
        echo "✅ Roadmap saved: $commit_msg"
        echo "💡 Run './scripts/roadmap.sh done' to return to main branch"
        ;;
        
    "done")
        # Switch back to main branch
        git checkout $PUBLIC_BRANCH
        
        # Restore any stashed changes
        if git stash list | grep -q "Auto-stash before roadmap edit"; then
            echo "📦 Restoring your previous changes..."
            git stash pop
        fi
        
        echo "✅ Back to main branch and ready for development"
        ;;
        
    "status")
        current_branch=$(git branch --show-current)
        echo "Current branch: $current_branch"
        
        if [ "$current_branch" = "$PRIVATE_BRANCH" ]; then
            echo "📝 In roadmap editing mode"
            if [ -f "$ROADMAP_FILE" ]; then
                echo "📄 Roadmap file exists and is ready for editing"
            fi
        else
            echo "💻 In development mode"
        fi
        ;;
        
    *)
        echo "🗺️  Roadmap Management Tool"
        echo ""
        echo "Usage: ./scripts/roadmap.sh [command]"
        echo ""
        echo "Commands:"
        echo "  edit   - Switch to roadmap editing mode (stashes current work)"
        echo "  save   - Save roadmap changes with optional commit message"
        echo "  done   - Return to main branch (restores stashed work)"
        echo "  status - Show current roadmap mode status"
        echo ""
        echo "Examples:"
        echo "  ./scripts/roadmap.sh edit"
        echo "  ./scripts/roadmap.sh save \"Added Q3 milestones\""
        echo "  ./scripts/roadmap.sh done"
        ;;
esac
