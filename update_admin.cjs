const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

// The english replacement
content = content.replace(
`📍 *Modes of Study Available:*
📍 *Offline Classes:* Practical, hands-on physical labs and classroom training.
💻 *Online Classes:* Learn from anywhere with our advanced interactive student app.`, 
`💻 *Mode of Study:* Online Class
🛡️ *100% Money Back Guarantee*`
);

content = content.replace(
`Ready to get started or learn more?
👉 *Fill out this quick inquiry form and we'll get right back to you:*
\${registerUrl}
\${videoLineEn}\${testimonyLineEn}\${posterLineEn}

📞 *Or reach us directly on Call / WhatsApp:* \${phoneNo}
\${socialLinksEn ? \`\${socialLinksEn}\\n\` : ""}
Let's build a healthier future together! ⭐️

🔗 *For Admission:* \${registerUrl}`, 
`\${videoLineEn}\${testimonyLineEn}\${posterLineEn}

📞 *Call / WhatsApp:* \${phoneNo}
🌐 *Website:* \${publicBaseUrl}

🔗 *For Admission:* \${registerUrl}`
);


// The tamil replacement
content = content.replace(
`📍 *வகுப்புகள் நடைபெறும் முறைகள்:*
📍 *நேரடி வகுப்புகள் (Offline):* நேரடி பயிற்சி மற்றும் செயல்முறை விளக்கங்கள்.
💻 *ஆன்லைன் வகுப்புகள் (Online):* எங்கள் மேம்பட்ட செயலி மூலம் எந்த இடத்திலிருந்தும் கற்கலாம்.`,
`💻 *பயிற்சி முறை:* ஆன்லைன் (Online)
🛡️ *100% பணம் திரும்பப் பெறும் உத்தரவாதம் (Money Back Guarantee)*`
);

content = content.replace(
`வகுப்பில் சேர அல்லது மேலும் விவரங்கள் அறிய:
👉 *இந்த எளிய விண்ணப்பப் படிவத்தைப் பூர்த்தி செய்யவும்:*
\${registerUrl}
\${videoLineTa}\${testimonyLineTa}\${posterLineTa}

📞 *நேரடித் தொடர்புக்கு (அழைப்பு / வாட்ஸ்அப்):* \${phoneNo}
\${socialLinksTa ? \`\${socialLinksTa}\\n\` : ""}
ஆரோக்கியமான எதிர்காலத்தை ஒன்றிணைந்து உருவாக்குவோம்! ⭐️

🔗 *இப்போதே பதிவு செய்ய:* \${registerUrl}`,
`\${videoLineTa}\${testimonyLineTa}\${posterLineTa}

📞 *அழைப்பு / வாட்ஸ்அப்:* \${phoneNo}
🌐 *இணையதளம்:* \${publicBaseUrl}

🔗 *இப்போதே பதிவு செய்ய:* \${registerUrl}`
);

fs.writeFileSync('src/pages/Admin.tsx', content);
console.log("Updated Admin.tsx");
