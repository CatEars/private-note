GITBRANCH=$(git symbolic-ref HEAD)
GITHASH=$(git log -n 1 --format=format:"%H")
echo "$GITBRANCH - $GITHASH"
