"use strict";(()=>{var e={};e.id=8032,e.ids=[8032],e.modules={1572:e=>{e.exports=require("nodemailer")},2142:(e,t,a)=>{a.r(t),a.d(t,{config:()=>l,default:()=>s,routeModule:()=>p});var o={};a.r(o),a.d(o,{default:()=>i});var d=a(3480),r=a(8667),n=a(6435);async function i(e,t){return t.status(403).json({error:"Solo disponible en desarrollo"})}a(7706);let s=(0,n.M)(o,"default"),l=(0,n.M)(o,"config"),p=new d.PagesAPIRouteModule({definition:{kind:r.A.PAGES_API,page:"/api/test/send-order-email",pathname:"/api/test/send-order-email",bundlePath:"",filename:""},userland:o})},3480:(e,t,a)=>{e.exports=a(5600)},5600:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6435:(e,t)=>{Object.defineProperty(t,"M",{enumerable:!0,get:function(){return function e(t,a){return a in t?t[a]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,a)):"function"==typeof t&&"default"===a?t:void 0}}})},7706:(e,t,a)=>{a.d(t,{m_:()=>i});var o=a(1572);let d=a.n(o)().createTransport({host:process.env.SMTP_HOST,port:parseInt(process.env.SMTP_PORT,10)||587,secure:!1,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}}),r=process.env.APP_NAME||"Carta Suelta";async function n({to:e,subject:t,htmlBody:a,textBody:o}){let n={from:`"${r}" <${process.env.SMTP_USER}>`,to:e,subject:t,html:a,text:o||a.replace(/<[^>]*>/g,"")};try{let t=await d.sendMail(n);return console.log(`Email enviado a ${e}: ${t.messageId}`),{success:!0,messageId:t.messageId}}catch(e){throw console.error("Error enviando email:",e),e}}async function i({to:e,orderCode:t,userName:a,items:o,totalPrice:d,paymentMethod:i,status:s}){let l=`${r} - Confirmaci\xf3n de Pedido #${t}`,p={webpay:"WebPay",mercadopago:"Mercado Pago"}[i]||"No especificado",c={pending:"Pendiente de pago",paid:"Pagado",shipped:"Enviado",delivered:"Entregado",cancelled:"Cancelado"}[s]||s,g=o.map(e=>`
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <img src="${e.image||e.imageUrl||""}" alt="${e.name}" width="50" height="70" style="border-radius: 4px; object-fit: cover;">
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${e.name}</strong>
        ${e.set?`<br><small style="color: #666;">${e.set}</small>`:""}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">x${e.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(e.price*e.quantity).toLocaleString("es-CL")}</td>
    </tr>
  `).join(""),u=o.map(e=>`- ${e.name} x${e.quantity} = $${(e.price*e.quantity).toLocaleString("es-CL")}`).join("\n");return n({to:e,subject:l,htmlBody:`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .order-code { background: #11998e; color: white; font-size: 24px; letter-spacing: 2px; padding: 15px 25px; text-align: center; border-radius: 8px; margin: 20px 0; display: inline-block; }
        .info-box { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold; }
        .status-paid { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        table { width: 100%; border-collapse: collapse; }
        .total-row { font-size: 18px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎴 \xa1Gracias por tu compra!</h1>
          <p>Tu pedido ha sido recibido</p>
        </div>
        <div class="content">
          <p>\xa1Hola <strong>${a}</strong>!</p>
          <p>Hemos recibido tu pedido correctamente. Aqu\xed est\xe1n los detalles:</p>
          
          <div style="text-align: center;">
            <div class="order-code">📦 ${t}</div>
          </div>
          
          <div class="info-box">
            <p><strong>Estado:</strong> <span class="status-badge ${"paid"===s?"status-paid":"status-pending"}">${c}</span></p>
            <p><strong>M\xe9todo de pago:</strong> ${p}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString("es-CL",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0;">📋 Detalle del pedido</h3>
            <table>
              <thead>
                <tr style="background: #f1f1f1;">
                  <th style="padding: 10px; text-align: left;" width="60"></th>
                  <th style="padding: 10px; text-align: left;">Producto</th>
                  <th style="padding: 10px; text-align: center;">Cant.</th>
                  <th style="padding: 10px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${g}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3" style="padding: 15px 10px; text-align: right;">Total:</td>
                  <td style="padding: 15px 10px; text-align: right; color: #11998e;">$${d.toLocaleString("es-CL")}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p style="color: #666; font-size: 14px;">
            Guarda este c\xf3digo de pedido para consultar el estado de tu compra.
            Te enviaremos actualizaciones cuando tu pedido sea enviado.
          </p>
        </div>
        <div class="footer">
          <p>\xbfTienes preguntas? Responde a este email.</p>
          <p>\xa9 ${new Date().getFullYear()} ${r}. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `,textBody:`
\xa1Hola ${a}!

\xa1Gracias por tu compra en ${r}!

Tu c\xf3digo de pedido es: ${t}

Estado: ${c}
M\xe9todo de pago: ${p}
Fecha: ${new Date().toLocaleDateString("es-CL")}

DETALLE DEL PEDIDO:
${u}

TOTAL: $${d.toLocaleString("es-CL")}

Guarda este c\xf3digo para consultar el estado de tu compra.

\xa9 ${new Date().getFullYear()} ${r}
  `})}},8667:(e,t)=>{Object.defineProperty(t,"A",{enumerable:!0,get:function(){return a}});var a=function(e){return e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE",e.IMAGE="IMAGE",e}({})}};var t=require("../../../webpack-api-runtime.js");t.C(e);var a=t(t.s=2142);module.exports=a})();