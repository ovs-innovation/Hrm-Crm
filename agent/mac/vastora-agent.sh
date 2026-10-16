#!/bin/sh
# Vastora agent for macOS. Leave the Terminal window open.
# Counts activity. Does not send typed characters.
# Usage: VASTORA_TOKEN=... VASTORA_API=http://localhost:5000 ./vastora-agent.sh

API="${VASTORA_API:-http://localhost:5000}"
API="${API%/}"
if [ -z "$VASTORA_TOKEN" ]; then
  echo "Set VASTORA_TOKEN to the employee access token."
  exit 1
fi

# Escape a string for safe inclusion inside a JSON double-quoted value.
json_escape() {
  printf '%s' "$1" | awk '
    BEGIN { ORS="" }
    {
      gsub(/\\/, "\\\\")
      gsub(/"/, "\\\"")
      gsub(/\t/, "\\t")
      gsub(/\r/, "\\r")
      gsub(/\n/, "\\n")
      print
    }
  '
}

echo "Vastora agent is running. Close this window to stop."
last_shot=0

while true; do
  app=$(osascript -e 'tell application "System Events" to get name of first process whose frontmost is true' 2>/dev/null)
  title=$(osascript -e 'tell application "System Events" to get title of front window of first process whose frontmost is true' 2>/dev/null)
  idle=$(ioreg -c IOHIDSystem | awk '/HIDIdleTime/ { print int($NF/1000000000); exit }')
  status="working"
  echo "$app" | grep -Eiq 'zoom|teams|webex' && status="meeting"
  project=""
  echo "$app" | grep -Eiq 'Code|Cursor' && project=$(printf '%s' "$title" | awk -F ' [-—|] ' '{ print $(NF-1) }')

  app_j=$(json_escape "$app")
  title_j=$(json_escape "$title")
  project_j=$(json_escape "$project")
  status_j=$(json_escape "$status")
  idle_n=${idle:-0}
  case "$idle_n" in
    ''|*[!0-9]*) idle_n=0 ;;
  esac

  body=$(printf '{"elapsed":30,"idleSeconds":%s,"app":"%s","window":"%s","project":"%s","status":"%s"}' \
    "$idle_n" "$app_j" "$title_j" "$project_j" "$status_j")
  now=$(date +%s)
  if [ $((now - last_shot)) -ge 600 ]; then
    file=$(mktemp /tmp/vastora-shot.XXXXXX.jpg)
    screencapture -x -t jpg "$file"
    b64=$(base64 < "$file" | tr -d '\n\r')
    rm -f "$file"
    # base64 alphabet is JSON-safe; still strip newlines above
    body=$(printf '{"elapsed":30,"idleSeconds":%s,"app":"%s","window":"%s","project":"%s","status":"%s","screenshot":"data:image/jpeg;base64,%s"}' \
      "$idle_n" "$app_j" "$title_j" "$project_j" "$status_j" "$b64")
    last_shot=$now
  fi
  curl -s -X POST "$API/api/wfh/agent" \
    -H "Authorization: Bearer $VASTORA_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$body" >/dev/null || echo "send failed"
  sleep 30
done
