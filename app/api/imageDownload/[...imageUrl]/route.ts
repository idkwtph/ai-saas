import axios from "axios";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { imageUrl: string } }
) {
  if (!params.imageUrl) {
    return new NextResponse("Image URL is required", { status: 400 });
  }

  const fixedUrl = "https://" + params.imageUrl;

  const imageDataUrl = decodeURI(fixedUrl);

  let res = await axios
    .get(imageDataUrl, { responseType: "arraybuffer" })
    .then((response) =>
      Buffer.from(response.data, "binary").toString("base64")
    );

  return NextResponse.json(res);
}
