"""Build Ansible inputs with JSON quoting, never shell interpolation of secrets."""
import json
import os
from pathlib import Path
import subprocess


def main():
    ip = subprocess.check_output(["terraform", "-chdir=infra", "output", "-raw", "instance_public_ip"], text=True).strip()
    # Terraform is the source of the host address; reject newlines and inventory syntax.
    import ipaddress
    ipaddress.IPv4Address(ip)
    Path("ansible/inventory.ini").write_text(f"[portfolio]\n{ip} ansible_user=ubuntu\n", encoding="utf-8")
    variables = {
        "portfolio_image": os.environ["PORTFOLIO_IMAGE"],
        "site_address": os.environ.get("SITE_ADDRESS") or ":80",
        "cloudflare_tunnel_token": os.environ.get("CLOUDFLARE_TUNNEL_TOKEN", ""),
        "tunnel_profile": "cloudflare" if os.environ.get("CLOUDFLARE_TUNNEL_TOKEN") else "demo" if os.environ.get("ENABLE_DEMO_TUNNEL") == "true" else "disabled",
    }
    path = Path("ansible/deploy-vars.json")
    path.write_text(json.dumps(variables), encoding="utf-8")
    path.chmod(0o600)
    with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
        output.write(f"ip={ip}\n")


if __name__ == "__main__":
    main()
