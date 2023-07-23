"use client";

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

export const CrispChat = () => {
  useEffect(() => {
    Crisp.configure("68d91690-34d4-4cc6-9bff-8d92b0f35d79");
  }, []);

  return null;
};
