const mammoth = require("mammoth");
const fs = require("fs");

const filePath = "C:\\Users\\Administrator\\Desktop\\全品类产品分类表（通用版）.docx";
const outputPath = "categories.txt";

console.log("Starting...");
try {
    if (fs.existsSync(filePath)) {
        mammoth.extractRawText({path: filePath})
            .then(function(result){
                fs.writeFileSync(outputPath, result.value || "No text found");
                console.log("Done. Written to " + outputPath);
            })
            .catch(function(err){
                fs.writeFileSync(outputPath, "Error: " + err.message);
                console.error(err);
            });
    } else {
        fs.writeFileSync(outputPath, "File not found");
        console.log("File not found");
    }
} catch (e) {
    fs.writeFileSync(outputPath, "Exception: " + e.message);
}
