interface PackageMetadata {
  name: string;
  version: string;
}

export async function fetchPackageMetadata(
  packageName: string,
): Promise<PackageMetadata | null> {
  let metadata: PackageMetadata | null = null;

  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    const body = (await response.json()) as any;

    metadata = {
      name: body.name,
      version: body["dist-tags"].latest,
    };
  } catch (error) {
    console.error(`Failed to fetch package metadata: ${String(error)}`);
  }

  return metadata;
}
