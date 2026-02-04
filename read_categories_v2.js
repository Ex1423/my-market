const mammoth = require("mammoth");
const fs = require("fs");

const filePath = "C:\\Users\\Administrator\\Desktop\\全品类产品分类表（通用版）.docx";

if (fs.existsSync(filePath)) {
    console.log("File exists.");
    
    mammoth.extractRawText({path: filePath})
        .then(function(result){
            console.log("Raw Text Result:");
            console.log(result.value || "[Empty Text]");
            console.log("Messages:", result.messages);
        })
        .catch(function(err){
            console.error("Error extracting text:", err);
        });
} else {
    console.error("File does not exist at path:", filePath);
}
