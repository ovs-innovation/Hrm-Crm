#!/bin/sh
# Vastora laptop agent for macOS. Tracks the front app and idle time.
# It does not record which keys were typed, and it does not take screenshots.
API="${VASTORA_API:-https://hrm.vastoratech.com}"
API="${API%/}"
if [ -z "$VASTORA_TOKEN" ]; then
  echo "This agent file has no login. Download it again from Work from home."
  exit 1
fi

DIR="$HOME/Library/Application Support/Vastora"
mkdir -p "$DIR"
LOG="$DIR/agent.log"
lockdir="$DIR/agent.lock"
if ! mkdir "$lockdir" 2>/dev/null; then
  echo "Vastora agent is already running."
  exit 0
fi
trap 'rmdir "$lockdir"' EXIT

if [ -n "$0" ] && [ "$0" != "sh" ]; then
  plist="$HOME/Library/LaunchAgents/com.vastora.wfh.plist"
  mkdir -p "$HOME/Library/LaunchAgents"
  cat > "$plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.vastora.wfh</string>
  <key>ProgramArguments</key>
  <array><string>/bin/sh</string><string>$0</string></array>
  <key>RunAtLoad</key><true/>
  <key>EnvironmentVariables</key>
  <dict>
    <key>VASTORA_TOKEN</key><string>$VASTORA_TOKEN</string>
    <key>VASTORA_API</key><string>$API</string>
  </dict>
</dict></plist>
EOF
  launchctl bootout "gui/$(id -u)/com.vastora.wfh" >/dev/null 2>&1 || true
  launchctl bootstrap "gui/$(id -u)" "$plist" >/dev/null 2>&1 || true
  echo "Installed. It will start again the next time you sign in to this Mac."
fi

echo "Vastora agent is running. Close this window to stop this session."
while true; do
  app=$(osascript -e 'tell application "System Events" to get name of first process whose frontmost is true' 2>/dev/null || echo unknown)
  title=$(osascript -e 'tell application "System Events" to get title of front window of first process whose frontmost is true' 2>/dev/null || echo "")
  idle=$(ioreg -c IOHIDSystem | awk '/HIDIdleTime/ { print int($NF/1000000000); exit }')
  app=$(printf '%s' "$app" | tr -d '"\\')
  title=$(printf '%s' "$title" | tr -d '"\\')
  status="working"
  echo "$app" | grep -Eiq 'zoom|teams|webex|skype' && status="meeting"
  project=""
  echo "$app" | grep -Eiq 'Code|Cursor' && project=$(printf '%s' "$title" | awk -F ' [-—|] ' '{ print $(NF-1) }')
  body=$(printf '{"elapsed":30,"idleSeconds":%s,"app":"%s","window":"%s","project":"%s","status":"%s"}' "${idle:-0}" "$app" "$title" "$project" "$status")
  curl -sS -m 25 -X POST "$API/api/wfh/agent" \
    -H "Authorization: Bearer $VASTORA_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$body" >> "$LOG" 2>&1 || echo "send failed, retrying" | tee -a "$LOG"
  sleep 30
done
