"use client"

import Script from "next/script"
import { DraggableChatHead } from "./DraggableChatHead"

export function TawkToChat() {
  const propertyId = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID
  const widgetId = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID || "default"

  // Only render if we have the property ID configured
  if (!propertyId) {
    return null
  }

  return (
    <>
      <DraggableChatHead />
      <Script
        id="tawkto-script"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            Tawk_API.onBeforeLoad = function(){
              if(typeof Tawk_API.hideWidget === 'function'){
                Tawk_API.hideWidget();
              }
            };
            Tawk_API.onLoad = function(){
              if(typeof Tawk_API.hideWidget === 'function'){
                Tawk_API.hideWidget();
              }
            };
            Tawk_API.onChatMinimized = function(){
              if(typeof Tawk_API.hideWidget === 'function'){
                Tawk_API.hideWidget();
              }
            };
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
    </>
  )
}
