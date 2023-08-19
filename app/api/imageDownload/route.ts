import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const { imageDataUrl } = body;

  if (!imageDataUrl) {
    return new NextResponse("URL is required.", { status: 400 });
  }

  let res = await axios
    .get(imageDataUrl, { responseType: "arraybuffer" })
    .then((response) =>
      Buffer.from(response.data, "binary").toString("base64")
    );

  return NextResponse.json(res);
}
