import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { adminEmail, orderId, customerEmail, cakeName, totalPrice, orderDate, deliveryDate, deliveryMethod, cancellationReason } = await req.json()

    // Email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Cancellation Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #AF524D; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .reason-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { color: #AF524D; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍰 Order Cancellation Notification</h1>
            <p>Bakery Bliss - Order Management System</p>
          </div>
          
          <div class="content">
            <h2>Order Cancellation Details</h2>
            
            <div class="order-details">
              <h3>Order Information</h3>
              <p><strong>Order ID:</strong> <span class="highlight">#${orderId}</span></p>
              <p><strong>Customer Email:</strong> ${customerEmail}</p>
              <p><strong>Cake:</strong> ${cakeName}</p>
              <p><strong>Total Amount:</strong> ₱${totalPrice.toLocaleString()}</p>
              <p><strong>Order Date:</strong> ${orderDate}</p>
              <p><strong>Delivery Date:</strong> ${deliveryDate}</p>
              <p><strong>Delivery Method:</strong> ${deliveryMethod}</p>
            </div>

            <div class="reason-box">
              <h3>📝 Cancellation Reason</h3>
              <p><em>"${cancellationReason}"</em></p>
            </div>

            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>✅ Action Required</h3>
              <p>This order has been automatically cancelled in the system. Please:</p>
              <ul>
                <li>Process any refunds if payment was made</li>
                <li>Update your inventory if ingredients were already allocated</li>
                <li>Contact the customer if you need additional information</li>
              </ul>
            </div>

            <div class="footer">
              <p>This is an automated notification from Bakery Bliss Order Management System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email using Resend (you can replace with your preferred email service)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Bakery Bliss <noreply@bakerybliss.com>',
        to: [adminEmail],
        subject: `Order Cancellation - #${orderId} - ${cakeName}`,
        html: emailHtml,
      }),
    })

    if (!emailResponse.ok) {
      throw new Error(`Email service error: ${emailResponse.statusText}`)
    }

    const emailData = await emailResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cancellation email sent successfully',
        emailId: emailData.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending cancellation email:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
