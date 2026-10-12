#!/bin/sh
# Vastora laptop agent for Linux desktops. Tracks the front app, idle time, and a screenshot.
# It does not record which keys were typed.
API="${VASTORA_API:-http://localhost:5000}"
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

last_shot=0
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
  now=$(date +%s)
  if [ $((now - last_shot)) -ge 600 ]; then
    file=$(mktemp /tmp/vastora-shot.XXXXXX.jpg)
    shot=0
    if command -v gnome-screenshot >/dev/null 2>&1; then gnome-screenshot -f "$file" && shot=1; fi
    if [ "$shot" -eq 0 ] && command -v import >/dev/null 2>&1; then import -window root "$file" && shot=1; fi
    if [ "$shot" -eq 1 ]; then
      b64=$(base64 < "$file" | tr -d '\n')
      body=$(printf '{"elapsed":30,"idleSeconds":%s,"app":"%s","window":"%s","status":"%s","screenshot":"data:image/jpeg;base64,%s"}' "${idle:-0}" "$app" "$title" "$status" "$b64")
      last_shot=$now
    fi
    rm -f "$file"
  fi
  curl -sS -m 25 -X POST "$API/api/wfh/agent" \
    -H "Authorization: Bearer $VASTORA_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$body" >> "$LOG" 2>&1 || echo "send failed, retrying" | tee -a "$LOG"
  sleep 30
done
