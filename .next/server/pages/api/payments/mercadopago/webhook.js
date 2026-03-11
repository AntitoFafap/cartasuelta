"use strict";(()=>{var e={};e.id=8105,e.ids=[8105],e.modules={163:(e,t,a)=>{a.r(t),a.d(t,{default:()=>r});let o=require("mysql2/promise"),r=a.n(o)().createPool({host:process.env.DB_HOST||"localhost",user:process.env.DB_USER,password:process.env.DB_PASS,database:process.env.DB_NAME,waitForConnections:!0,connectionLimit:10})},1572:e=>{e.exports=require("nodemailer")},3480:(e,t,a)=>{e.exports=a(5600)},5104:e=>{e.exports=require("mercadopago")},5600:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6065:(e,t,a)=>{a.r(t),a.d(t,{getCache:()=>n,invalidateCache:()=>i,setCache:()=>d});let o=null,r=null;function n(){let e=Date.now();return o&&r&&e-r<3e4?o:null}function d(e){o=e,r=Date.now()}function i(){o=null,r=null}},6435:(e,t)=>{Object.defineProperty(t,"M",{enumerable:!0,get:function(){return function e(t,a){return a in t?t[a]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,a)):"function"==typeof t&&"default"===a?t:void 0}}})},7706:(e,t,a)=>{a.d(t,{m_:()=>i});var o=a(1572);let r=a.n(o)().createTransport({host:process.env.SMTP_HOST,port:parseInt(process.env.SMTP_PORT,10)||587,secure:!1,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}}),n=process.env.APP_NAME||"Carta Suelta";async function d({to:e,subject:t,htmlBody:a,textBody:o}){let d={from:`"${n}" <${process.env.SMTP_USER}>`,to:e,subject:t,html:a,text:o||a.replace(/<[^>]*>/g,"")};try{let t=await r.sendMail(d);return console.log(`Email enviado a ${e}: ${t.messageId}`),{success:!0,messageId:t.messageId}}catch(e){throw console.error("Error enviando email:",e),e}}async function i({to:e,orderCode:t,userName:a,items:o,totalPrice:r,paymentMethod:i,status:s}){let l=`${n} - Confirmaci\xf3n de Pedido #${t}`,c={webpay:"WebPay",mercadopago:"Mercado Pago"}[i]||"No especificado",p={pending:"Pendiente de pago",paid:"Pagado",shipped:"Enviado",delivered:"Entregado",cancelled:"Cancelado"}[s]||s,u=o.map(e=>`
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
  `).join(""),g=o.map(e=>`- ${e.name} x${e.quantity} = $${(e.price*e.quantity).toLocaleString("es-CL")}`).join("\n");return d({to:e,subject:l,htmlBody:`
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
            <p><strong>Estado:</strong> <span class="status-badge ${"paid"===s?"status-paid":"status-pending"}">${p}</span></p>
            <p><strong>M\xe9todo de pago:</strong> ${c}</p>
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
                ${u}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3" style="padding: 15px 10px; text-align: right;">Total:</td>
                  <td style="padding: 15px 10px; text-align: right; color: #11998e;">$${r.toLocaleString("es-CL")}</td>
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
          <p>\xa9 ${new Date().getFullYear()} ${n}. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `,textBody:`
\xa1Hola ${a}!

\xa1Gracias por tu compra en ${n}!

Tu c\xf3digo de pedido es: ${t}

Estado: ${p}
M\xe9todo de pago: ${c}
Fecha: ${new Date().toLocaleDateString("es-CL")}

DETALLE DEL PEDIDO:
${g}

TOTAL: $${r.toLocaleString("es-CL")}

Guarda este c\xf3digo para consultar el estado de tu compra.

\xa9 ${new Date().getFullYear()} ${n}
  `})}},7772:(e,t,a)=>{a.r(t),a.d(t,{config:()=>x,default:()=>g,routeModule:()=>m});var o={};a.r(o),a.d(o,{default:()=>u});var r=a(3480),n=a(8667),d=a(6435),i=a(5104),s=a(163),l=a(7706),c=a(6065);let p=new i.MercadoPagoConfig({accessToken:process.env.MERCADOPAGO_ACCESS_TOKEN||"TEST-ACCESS-TOKEN"});async function u(e,t){if("POST"!==e.method)return t.status(405).json({error:"M\xe9todo no permitido"});try{let{type:a,data:o}=e.body;if("payment"===a){let e=o?.id;if(e){let t=new i.Payment(p),a=await t.get({id:e});console.log("Webhook Mercado Pago - Pago recibido:",{id:a.id,status:a.status,external_reference:a.external_reference,transaction_amount:a.transaction_amount});let o=a.external_reference,r=null;if(o){let[e]=await s.default.query("SELECT * FROM orders WHERE orderCode = ?",[o]);r=e[0]||null}switch(a.status){case"approved":if(console.log("✅ Pago aprobado:",o),r&&"paid"!==r.status){await s.default.query("UPDATE orders SET status = ?, paymentId = ?, updatedAt = ? WHERE id = ?",["paid",String(a.id),new Date().toISOString(),r.id]);let e="string"==typeof r.items?JSON.parse(r.items):r.items;for(let t of e){let[e]=await s.default.query("SELECT * FROM inventory WHERE id = ?",[t.id]),a=e[0];if(a){let e=Math.max(0,a.stock-t.quantity);await s.default.query("UPDATE inventory SET stock = ? WHERE id = ?",[e,t.id])}}(0,c.invalidateCache)();try{await (0,l.m_)({to:r.userEmail,orderCode:r.orderCode,userName:r.userName||r.userEmail.split("@")[0],items:e,totalPrice:r.totalPrice,paymentMethod:"mercadopago",status:"paid"}),console.log(`Email de confirmaci\xf3n enviado a ${r.userEmail}`)}catch(e){console.error("Error enviando email:",e)}}break;case"pending":console.log("⏳ Pago pendiente:",o),r&&await s.default.query("UPDATE orders SET paymentId = ?, updatedAt = ? WHERE id = ?",[String(a.id),new Date().toISOString(),r.id]);break;case"rejected":console.log("❌ Pago rechazado:",o);break;case"cancelled":console.log("\uD83D\uDEAB Pago cancelado:",o),r&&await updateOrder(r.id,{status:"cancelled",updatedAt:new Date().toISOString()});break;default:console.log("Estado de pago:",a.status)}}}return t.status(200).json({received:!0})}catch(e){return console.error("Error procesando webhook Mercado Pago:",e),t.status(200).json({error:"Error interno",received:!0})}}let g=(0,d.M)(o,"default"),x=(0,d.M)(o,"config"),m=new r.PagesAPIRouteModule({definition:{kind:n.A.PAGES_API,page:"/api/payments/mercadopago/webhook",pathname:"/api/payments/mercadopago/webhook",bundlePath:"",filename:""},userland:o})},8667:(e,t)=>{Object.defineProperty(t,"A",{enumerable:!0,get:function(){return a}});var a=function(e){return e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE",e.IMAGE="IMAGE",e}({})}};var t=require("../../../../webpack-api-runtime.js");t.C(e);var a=t(t.s=7772);module.exports=a})();