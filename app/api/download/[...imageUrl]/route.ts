import { auth } from "@clerk/nextjs";
import axios from "axios";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { imageUrl: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.imageUrl) {
      return new NextResponse("Image URL is required", { status: 400 });
    }

    const imageDataUrl = decodeURI(params.imageUrl);

    let res = await axios
      .get(imageDataUrl, { responseType: "arraybuffer" })
      .then((response) =>
        Buffer.from(response.data, "binary").toString("base64")
      );

    return NextResponse.json(res);
  } catch (error) {
    console.log("DOWNLOADS_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
