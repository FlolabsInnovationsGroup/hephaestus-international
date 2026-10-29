"use client";

import { useEffect, useRef, useState } from "react";

const FORM_ORIGIN = "https://crm.flolabsinnovations.com";
const ORG_ID = "72138f98-ad15-4929-af96-be3868b77adb";
const FORM_ID = "4b2810f0-0239-497c-b1d0-c15e2c8a33b5";

type FormMessage = {
  type?: string;
  formId?: string;
  height?: number;
};

export function CrmApplicationForm() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [height, setHeight] = useState(480);

  useEffect(() => {
    const query = new URLSearchParams();
    query.set("embed", "1");
    query.set("sourceUrl", window.location.href);
    setSrc(`${FORM_ORIGIN}/forms/${ORG_ID}/${FORM_ID}?${query.toString()}`);
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent<FormMessage>) {
      // The CRM page is sandboxed, so its origin is "null" rather than the CRM host.
      if (event.origin !== FORM_ORIGIN && event.origin !== "null") return;

      const iframe = iframeRef.current;
      if (!iframe || event.source !== iframe.contentWindow) return;

      const data = event.data;
      if (!data || data.formId !== FORM_ID) return;

      if (data.type === "flolabs-form:resize" && typeof data.height === "number" && data.height > 0) {
        setHeight(Math.ceil(data.height));
      }

      if (data.type === "flolabs-form:submitted" || data.type === "flolabs-form:step") {
        iframe.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="crm-application-form-shell">
      {src ? (
        <iframe
          ref={iframeRef}
          src={src}
          title="Hephaestus Application form"
          scrolling="no"
          className="crm-application-form"
          style={{ height }}
        />
      ) : (
        <div className="min-h-48 w-full" aria-hidden />
      )}
    </div>
  );
}
