"""Create the private versioned state bucket once, before terraform init."""
import os
import oci


def main():
    config = oci.config.from_file()
    client = oci.object_storage.ObjectStorageClient(config)
    namespace = client.get_namespace().data
    name = os.environ.get("TF_STATE_BUCKET", "portfolio-terraform-state")
    try:
        bucket = client.get_bucket(namespace, name).data
        if bucket.public_access_type != "NoPublicAccess":
            raise SystemExit("El bucket de estado debe ser privado.")
        if bucket.versioning != "Enabled":
            client.update_bucket(namespace, name, oci.object_storage.models.UpdateBucketDetails(versioning="Enabled"))
    except oci.exceptions.ServiceError as error:
        if error.status != 404:
            raise
        client.create_bucket(namespace, oci.object_storage.models.CreateBucketDetails(
            name=name, compartment_id=os.environ["OCI_COMPARTMENT_OCID"],
            public_access_type="NoPublicAccess", versioning="Enabled",
        ))
    with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
        output.write(f"namespace={namespace}\n")
        output.write(f"bucket={name}\n")


if __name__ == "__main__":
    main()
