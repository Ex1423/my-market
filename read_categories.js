const mammoth = require("mammoth");

const filePath = "C:\\Users\\Administrator\\Desktop\\全品类产品分类表（通用版）.docx";

mammoth.extractRawText({path: filePath})
    .then(function(result){
        const text = result.value; // The raw text
        console.log(text);
    })
    .catch(function(err){
        console.error("Error reading file:", err);
    });
