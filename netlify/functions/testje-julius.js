import ftp from "basic-ftp";
import fs from 'fs';
import path from 'path';
import os from 'os';

// Netlify serverless function
export async function handler(event, context) {
    
    const client = new ftp.Client();
    client.ftp.verbose = true; // optioneel, voor debug logs

    try {
        await client.access({
            host: "ftp.vdmdtg.nl",//process.env.FTP_HOST,
            user: "TEDDYSHONDENSHOP",//process.env.FTP_USER,
            password: "FnoAFj02086h",//process.env.FTP_PASSWORD,
            secure: false // of true als je FTPS gebruikt
        });

        console.log("Connected to FTP");

        // Create a temporary file path
        const tempFilePath = path.join(os.tmpdir(), "testje-local-download-export.xml");
        
        // Download the file to the temporary location
        await client.downloadTo(tempFilePath, "/export/exportXML_UTF8.xml");
        
        // Read the file content
        const fileContent = fs.readFileSync(tempFilePath, 'utf8');
        
        
        // Clean up the temporary file
        fs.unlinkSync(tempFilePath);

        // Of bestand uploaden
        // await client.uploadFrom("local-file.txt", "/remote/uploaded.txt");

        client.close();
        
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': 'attachment; filename="exportXML_UTF8.xml"'
          },
          body: fileContent
        };
    } catch (err) {
        console.error("FTP error:", err);
        client.close();
        
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Failed to download file", details: err.message })
        };
    }
}