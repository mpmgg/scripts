const versions: { plugId: number; id: number; url?: string }[] = new Array();

export default async function fetchVersions(id: any) {
  try {
    const res = await fetch(
      `https://api.spiget.org/v2/resources/${id}/versions?size=9999`
    );
    const json = await res.json();
    for (let i = 0; i < json.length; i++) {
      versions.push({ plugId: id, ...json[i] });
    }
  } catch (e: any) {
    console.log(e);
  }
  return versions;
}
