#!/bin/sh
# Vastora laptop agent for Linux desktops. Tracks the front app and idle time.
# It does not record which keys were typed, and it does not take screenshots.
API="${VASTORA_API:-https://hrm.vastoratech.com}"
API="${API%/}"
if [ -z "$VASTORA_TOKEN" ]; then
  echo "This agent file has no login. Download it again from Work from home."
  exit 1
fi

DIR="${XDG_DATA_HOME:-$HOME/.local/share}/Vastora"
mkdir -p "$DIR" "$HOME/.config/autostart"
LOG="$DIR/agent.log"
lockdir="$DIR/agent.lock"
if ! mkdir "$lockdir" 2>/dev/null; then
  echo "Vastora agent is already running."
  exit 0
fi
trap 'rmdir "$lockdir"' EXIT

if [ -n "$0" ] && [ -f "$0" ]; then
  cat > "$HOME/.config/autostart/vastora-wfh.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Vastora WFH
Exec=/bin/sh "$0"
X-GNOME-Autostart-enabled=true
EOF
  echo "Installed. It will start again the next time you sign in to this desktop."
fi

idle_seconds() {
  if command -v xprintidle >/dev/null 2>&1; then
    echo $(( $(xprintidle) / 1000 ))
    return
  fi
  echo 0
}

front_app() {
  if command -v xdotool >/dev/null 2>&1; then
    id=$(xdotool getactivewindow 2>/dev/null) || return
    xdotool getwindowname "$id" 2>/dev/null
    return
  fi
  echo unknown
}

echo "Vastora agent is running. Close this window to stop this session."
while true; do
  title=$(front_app)
  app=$(printf '%s' "$title" | awk '{ print $1 }')
  [ -z "$app" ] && app=unknown
  idle=$(idle_seconds)
  app=$(printf '%s' "$app" | tr -d '"\\')
  title=$(printf '%s' "$title" | tr -d '"\\')
  status="working"
  echo "$title" | grep -Eiq 'zoom|teams|webex' && status="meeting"
  body=$(printf '{"elapsed":30,"idleSeconds":%s,"app":"%s","window":"%s","status":"%s"}' "${idle:-0}" "$app" "$title" "$status")
  curl -sS -m 25 -X POST "$API/api/wfh/agent" \
    -H "Authorization: Bearer $VASTORA_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$body" >> "$LOG" 2>&1 || echo "send failed, retrying" | tee -a "$LOG"
  sleep 30
done
