"use strict";(()=>{var e={};e.id=9932,e.ids=[9932],e.modules={163:(e,t,a)=>{a.r(t),a.d(t,{default:()=>r});let o=require("mysql2/promise"),r=a.n(o)().createPool({host:process.env.DB_HOST||"localhost",user:process.env.DB_USER,password:process.env.DB_PASS,database:process.env.DB_NAME,waitForConnections:!0,connectionLimit:10})},946:(e,t,a)=>{let o;a.r(t),a.d(t,{config:()=>m,default:()=>g,routeModule:()=>x});var r={};a.r(r),a.d(r,{default:()=>u});var n=a(3480),d=a(8667),i=a(6435),s=a(9553),l=a(163),p=a(7706),c=a(6065);async function u(e,t){let a="POST"===e.method?e.body.token_ws:e.query.token_ws,r="POST"===e.method?e.body.TBK_TOKEN:e.query.TBK_TOKEN,n=process.env.NEXT_PUBLIC_BASE_URL||"http://localhost:3000";if(r||!a)return console.log("Pago cancelado o sin token:",{tbkToken:r,token:a}),t.redirect(302,`${n}/payment-result?status=cancelled`);try{let e=await o.commit(a);if(console.log("Respuesta WebPay:",e),0!==e.responseCode)return t.redirect(302,`${n}/payment-result?status=rejected&code=${e.responseCode}`);{let[a]=await l.default.query("SELECT * FROM orders WHERE orderCode = ?",[e.buyOrder]),o=a[0];if(o){await l.default.query("UPDATE orders SET status = ?, paymentId = ?, updatedAt = ? WHERE id = ?",["paid",e.authorizationCode,new Date().toISOString(),o.id]);let t="string"==typeof o.items?JSON.parse(o.items):o.items;for(let e of t){let[t]=await l.default.query("SELECT * FROM inventory WHERE id = ?",[e.id]),a=t[0];if(a){let t=Math.max(0,a.stock-e.quantity);await l.default.query("UPDATE inventory SET stock = ? WHERE id = ?",[t,e.id])}}(0,c.invalidateCache)();try{await (0,p.m_)({to:o.userEmail,orderCode:o.orderCode,userName:o.userName||o.userEmail.split("@")[0],items:t,totalPrice:o.totalPrice,paymentMethod:"webpay",status:"paid"}),console.log(`Email de confirmaci\xf3n enviado a ${o.userEmail}`)}catch(e){console.error("Error enviando email:",e)}}let r={orderCode:e.buyOrder,buyOrder:e.buyOrder,amount:e.amount,authorizationCode:e.authorizationCode,cardNumber:e.cardDetail?.cardNumber||"XXXX",transactionDate:e.transactionDate,paymentType:e.paymentTypeCode,installments:e.installmentsNumber},d=encodeURIComponent(JSON.stringify(r));return t.redirect(302,`${n}/payment-result?status=success&data=${d}`)}}catch(e){return console.error("Error confirmando transacci\xf3n WebPay:",e),t.redirect(302,`${n}/payment-result?status=error&message=${encodeURIComponent(e.message)}`)}}o="production"===process.env.WEBPAY_ENVIRONMENT?new s.WebpayPlus.Transaction({commerceCode:process.env.WEBPAY_COMMERCE_CODE,apiKey:process.env.WEBPAY_API_KEY,environment:"production"}):new s.WebpayPlus.Transaction;let g=(0,i.M)(r,"default"),m=(0,i.M)(r,"config"),x=new n.PagesAPIRouteModule({definition:{kind:d.A.PAGES_API,page:"/api/payments/webpay/confirm",pathname:"/api/payments/webpay/confirm",bundlePath:"",filename:""},userland:r})},1572:e=>{e.exports=require("nodemailer")},3480:(e,t,a)=>{e.exports=a(5600)},5600:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6065:(e,t,a)=>{a.r(t),a.d(t,{getCache:()=>n,invalidateCache:()=>i,setCache:()=>d});let o=null,r=null;function n(){let e=Date.now();return o&&r&&e-r<3e4?o:null}function d(e){o=e,r=Date.now()}function i(){o=null,r=null}},6435:(e,t)=>{Object.defineProperty(t,"M",{enumerable:!0,get:function(){return function e(t,a){return a in t?t[a]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,a)):"function"==typeof t&&"default"===a?t:void 0}}})},7706:(e,t,a)=>{a.d(t,{m_:()=>i});var o=a(1572);let r=a.n(o)().createTransport({host:process.env.SMTP_HOST,port:parseInt(process.env.SMTP_PORT,10)||587,secure:!1,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}}),n=process.env.APP_NAME||"Carta Suelta";async function d({to:e,subject:t,htmlBody:a,textBody:o}){let d={from:`"${n}" <${process.env.SMTP_USER}>`,to:e,subject:t,html:a,text:o||a.replace(/<[^>]*>/g,"")};try{let t=await r.sendMail(d);return console.log(`Email enviado a ${e}: ${t.messageId}`),{success:!0,messageId:t.messageId}}catch(e){throw console.error("Error enviando email:",e),e}}async function i({to:e,orderCode:t,userName:a,items:o,totalPrice:r,paymentMethod:i,status:s}){let l=`${n} - Confirmaci\xf3n de Pedido #${t}`,p={webpay:"WebPay",mercadopago:"Mercado Pago"}[i]||"No especificado",c={pending:"Pendiente de pago",paid:"Pagado",shipped:"Enviado",delivered:"Entregado",cancelled:"Cancelado"}[s]||s,u=o.map(e=>`
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

Estado: ${c}
M\xe9todo de pago: ${p}
Fecha: ${new Date().toLocaleDateString("es-CL")}

DETALLE DEL PEDIDO:
${g}

TOTAL: $${r.toLocaleString("es-CL")}

Guarda este c\xf3digo para consultar el estado de tu compra.

\xa9 ${new Date().getFullYear()} ${n}
  `})}},8667:(e,t)=>{Object.defineProperty(t,"A",{enumerable:!0,get:function(){return a}});var a=function(e){return e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE",e.IMAGE="IMAGE",e}({})},9553:e=>{e.exports=require("transbank-sdk")}};var t=require("../../../../webpack-api-runtime.js");t.C(e);var a=t(t.s=946);module.exports=a})();