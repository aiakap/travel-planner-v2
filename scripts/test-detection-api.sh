#!/bin/bash

# Test the detection API with the Sansui Niseko transfer email

echo "Testing Detection API..."
echo "========================"
echo ""

curl -X POST http://localhost:3000/api/chat/detect-paste \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "text": "Dear Mr Alex Kaplinsky, Greetings from Hokkaido, Japan. Thank you for the booking request through Sansui Niseko. We are happy to provide the transfer service for you with Alphard/ Vellfire. (Vellfire is a sportier version of Alphard) Please accept an invoice and credit card payment links attached after the request details. Payment due is 23:59:59 today on January 27th, 2026 (Japan Standard Time). If unfortunately not paid, your booking request shall be canceled. Two payment links are attached just in case. If the first one does not work well, please use the second one. Please be sure not to pay in double. Meanwhile we are preparing for your transfer as follows: Booking request (not confirmed yet)------------------- Lead guest：Mr Alex Kaplinsky Passengers：2 adults Luggage： 2 ski bags Arrival Booking No：R08010702 <Arrival> Date： January 30, 2026 Pickup Location： New Chitose Airport (CTS) Destination： SANSUI NISEKO Flight Number： UA8006 (NH73) eta 18:35 Car type：Alphard Cost：¥52,000, including tax *the driver will be waiting for you at the arrival hall (after baggage claim and Customs) showing a name board. *the drive normally takes 2-2.5 hrs. A short break can be taken on the way if requested. Payment due：23:59:59 today on January 27th, 2026 (Japan Standard Time)."
}
EOF

echo ""
echo ""
echo "========================"
echo "Expected: suggestedAction should be 'extract'"
echo "Expected: detectedType should be 'Private Driver'"
echo "Expected: confidence should be >= 0.7"
