const FOLDER_ID = "1ht897NX1V1LPE46ISiwtuk0HpbAh23hE";

function doPost(e) {
    try {
        // Check if postData exists
        if (!e || !e.postData || !e.postData.contents) {
            throw new Error("No file uploaded");
        }

        var data = JSON.parse(e.postData.contents);
        var base64 = data.base64;
        var filename = data.filename;
        var mimeType = data.mimeType;

        if (!base64 || !filename || !mimeType) {
            throw new Error("Missing required fields: base64, filename, or mimeType");
        }

        var decoded = Utilities.base64Decode(base64);
        var blob = Utilities.newBlob(decoded, mimeType, filename);

        if (blob.getBytes().length > 5 * 1024 * 1024) {
            throw new Error("File exceeds 5MB limit");
        }

        var folder = DriveApp.getFolderById(FOLDER_ID);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            fileId: file.getId(),
            previewUrl: "https://drive.google.com/file/d/" + file.getId() + "/preview"
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: err.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

function doGet(e) {
    return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "This endpoint only accepts POST requests"
    })).setMimeType(ContentService.MimeType.JSON);
}
