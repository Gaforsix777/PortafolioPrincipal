"""Materialize CI secrets in a private temporary directory; never print them."""
import json
import os
from pathlib import Path
import subprocess


def main():
    required = ["OCI_TENANCY_OCID", "OCI_USER_OCID", "OCI_FINGERPRINT", "OCI_PRIVATE_KEY", "OCI_COMPARTMENT_OCID", "SSH_PRIVATE_KEY"]
    missing = [key for key in required if not os.environ.get(key)]
    if missing:
        raise SystemExit("Faltan secretos de GitHub: " + ", ".join(missing))
    secret_dir = Path(os.environ["RUNNER_TEMP"]) / "portfolio-secrets"
    secret_dir.mkdir(mode=0o700, exist_ok=True)
    api_key = secret_dir / "oci.pem"
    ssh_key = secret_dir / "ssh"
    for path, value in [(api_key, os.environ["OCI_PRIVATE_KEY"]), (ssh_key, os.environ["SSH_PRIVATE_KEY"])]:
        path.write_text(value.replace("\r\n", "\n").strip() + "\n", encoding="utf-8")
        path.chmod(0o600)
    public_key = subprocess.check_output(["ssh-keygen", "-y", "-f", str(ssh_key)], text=True).strip()
    oci_dir = Path.home() / ".oci"
    oci_dir.mkdir(mode=0o700, exist_ok=True)
    config = oci_dir / "config"
    config.write_text("[DEFAULT]\n" + "\n".join([
        f"user={os.environ['OCI_USER_OCID']}", f"tenancy={os.environ['OCI_TENANCY_OCID']}",
        f"fingerprint={os.environ['OCI_FINGERPRINT']}", f"key_file={api_key}",
        f"region={os.environ['OCI_REGION']}",
    ]) + "\n", encoding="utf-8")
    config.chmod(0o600)
    cidrs = [os.environ["RUNNER_IP"] + "/32"]
    if os.environ.get("ADMIN_SSH_CIDR"):
        cidrs.append(os.environ["ADMIN_SSH_CIDR"])
    with open(os.environ["GITHUB_ENV"], "a", encoding="utf-8") as output:
        for key, value in {
            "TF_VAR_compartment_ocid": os.environ["OCI_COMPARTMENT_OCID"],
            "TF_VAR_region": os.environ["OCI_REGION"], "TF_VAR_ssh_public_key": public_key,
            "TF_VAR_ssh_cidrs": json.dumps(cidrs), "DEPLOY_SSH_KEY": str(ssh_key),
        }.items():
            if "\n" in value or "\r" in value:
                raise ValueError("Unexpected newline in single-line CI variable")
            output.write(f"{key}={value}\n")


if __name__ == "__main__":
    main()
