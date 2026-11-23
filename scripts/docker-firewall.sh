#!/usr/bin/env bash
set -euo pipefail
# Docker DNAT bypasses UFW INPUT. Filter forwarded external connections too.
external_if=$(ip -4 route show default | awk 'NR==1 {print $5}')
test -n "$external_if"
for port in 22 80 443; do
  iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null || iptables -I INPUT 1 -p tcp --dport "$port" -j ACCEPT
done
iptables -N PORTFOLIO-DOCKER 2>/dev/null || true
iptables -F PORTFOLIO-DOCKER
iptables -A PORTFOLIO-DOCKER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
iptables -A PORTFOLIO-DOCKER -i "$external_if" -p tcp -m conntrack --ctorigdstport 80 -j RETURN
iptables -A PORTFOLIO-DOCKER -i "$external_if" -p tcp -m conntrack --ctorigdstport 443 -j RETURN
iptables -A PORTFOLIO-DOCKER -i "$external_if" -j DROP
iptables -A PORTFOLIO-DOCKER -j RETURN
iptables -C DOCKER-USER -j PORTFOLIO-DOCKER 2>/dev/null || iptables -I DOCKER-USER 1 -j PORTFOLIO-DOCKER
