"use client"

import Script from "next/script"

export function TawkToChat() {
  const propertyId = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID
  const widgetId = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID || "default"

  // Only render if we have the property ID configured
  if (!propertyId) {
    return null
  }

  return (
    <Script
      id="tawkto-script"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src='https://embed.tawk.to/${propertyId}/${widgetId}';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
          })();
        `,
      }}
    />
  )
}
