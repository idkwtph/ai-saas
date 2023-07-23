"use client";

import axios from "axios";
import * as z from "zod";
import { Check, Download, ImageIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createElement, useState } from "react";

import Heading from "@/components/heading";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Empty from "@/components/empty";
import Loader from "@/components/loader";

import { amountOptions, formSchema, resolutionOptions } from "./constants";
import { Card, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { useProModal } from "@/hooks/use-pro-modal";
import { ClipLoader, PulseLoader } from "react-spinners";
import toast from "react-hot-toast";

const ImagePage = () => {
  const proModal = useProModal();
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [fetched, setFetched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [elementsLoading, setElementsLoading] = useState([
    { loading: false, downloaded: false, disabled: false },
    { loading: false, downloaded: false, disabled: false },
    { loading: false, downloaded: false, disabled: false },
    { loading: false, downloaded: false, disabled: false },
    { loading: false, downloaded: false, disabled: false },
  ]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      amount: "1",
      resolution: "512x512",
    },
  });

  const isLoading = form.formState.isSubmitting;

  function base64ToBlob(
    base64Data: string,
    contentType: string = ""
  ): Blob | null {
    const byteCharacters = atob(base64Data); // Decode the Base64 string
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    try {
      // Create the Blob from the binary array
      const blob = new Blob(byteArrays, { type: contentType });
      return blob;
    } catch (e) {
      console.error("Error creating Blob:", e);
      toast.error("Something went wrong with encoding image download");
      return null;
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setImages([]);

      const response = await axios.post("/api/image", values);

      const urls = response.data.map((image: { url: string }) => image.url);

      setImages(urls);
      form.reset();
    } catch (error: any) {
      if (error?.response?.status == 403) {
        proModal.onOpen();
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      router.refresh();
    }
  };

  const onDownload = async (name: string, index: number) => {
    let elements = elementsLoading;

    setFetching(true);

    elements[index].loading = true;

    for (let i = 0; i < elements.length; i++) {
      if (!(i === index)) {
        elements[i].disabled = true;
      }
    }

    elements[index].disabled = false;

    setElementsLoading(elements);

    const url = images[index];

    if (!url) {
      throw new Error("Resource URL not provided! You need to provide one");
    }

    setFetched(false);
    await fetch(`/api/download/${encodeURIComponent(url)}`)
      .then((response) => response.json())
      .then(function (response) {
        let elements = elementsLoading;
        const blob = base64ToBlob(response, "image/png");
        const blobUrl = URL.createObjectURL(blob!);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.setAttribute("download", name);
        document.body.appendChild(a);
        a.click();
        a.remove();
        setFetching(false);
        setFetched(true);
        elements[index].loading = false;
        elements[index].downloaded = true;
        for (let i = 0; i < elements.length; i++) {
          elements[i].disabled = false;
        }
        setElementsLoading(elements);
      });

    setTimeout(() => {
      let elements = elementsLoading;
      elements[index].loading = false;
      elements[index].downloaded = false;
      elements[index].disabled = false;
      setElementsLoading(elements);
      setFetched(false);
    }, 2500);
  };

  return (
    <div>
      <Heading
        title="Image Generation"
        description="Turn your prompt into an image."
        icon={ImageIcon}
        iconColor="text-pink-700"
        bgColor="bg-pink-700/10"
      />
      <div className="px-4 lg:px-8">
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="
                rounded-lg 
                border 
                w-full 
                p-4 
                px-3 
                md:px-6 
                focus-within:shadow-sm
                grid
                grid-cols-12
                gap-2
              "
            >
              <FormField
                name="prompt"
                render={({ field }) => (
                  <FormItem className="col-span-12 lg:col-span-6">
                    <FormControl className="m-0 p-0">
                      <Input
                        className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                        disabled={isLoading}
                        placeholder="A picture of a horse in Swiss Alps"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="col-span-12 lg:col-span-2">
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue defaultValue={field.value} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {amountOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="resolution"
                render={({ field }) => (
                  <FormItem className="col-span-12 lg:col-span-2">
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue defaultValue={field.value} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {resolutionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <Button
                className="col-span-12 lg:col-span-2 w-full"
                type="submit"
                disabled={isLoading}
                size="icon"
              >
                Generate
              </Button>
            </form>
          </Form>
        </div>
        <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="p-20">
              <Loader />
            </div>
          )}
          {images.length === 0 && !isLoading && (
            <Empty label="No images generated." />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
            {images.map((src, index) => (
              <Card key={src} className="rounded-lg overflow-hidden">
                <div className="relative aspect-square">
                  <Image alt="Image" fill src={src} />
                </div>
                <CardFooter className="p-2" key="uniqueKey">
                  <Button
                    onClick={() => onDownload("image.png", index)}
                    variant="secondary"
                    className="w-full"
                    key="uniqueKey5"
                    disabled={elementsLoading[index].disabled}
                  >
                    {elementsLoading[index]?.loading &&
                      !elementsLoading[index]?.downloaded && (
                        <>
                          <ClipLoader
                            size={15}
                            className="text-zinc-900 mr-2"
                          />
                          Downloading...
                        </>
                      )}
                    {!elementsLoading[index]?.loading &&
                      elementsLoading[index]?.downloaded && (
                        <>
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          Downloaded
                        </>
                      )}
                    {!elementsLoading[index]?.loading &&
                      !elementsLoading[index]?.downloaded && (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePage;
