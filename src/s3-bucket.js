const S3 = require('aws-sdk/clients/s3')
const fs = require('fs')

const BUCKET_NAME = process.env.S3_BUCKET_NAME

const s3bucket = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

function sendFileFromS3(filePath, res) {
  const getParams = {
    Bucket: BUCKET_NAME,
    Key: filePath,
  }

  s3bucket.getObject(getParams, (err, data) => {
    if (err) {
      return res.status(400).send({ success: false, err: err })
    } else {
      return res.send(data.Body)
    }
  })
}

async function fileExistsOnS3(filePath) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: filePath,
  }
  return s3bucket
    .headObject(params, (err, data) => {
      if (err) {
        return err
      }
      return data
    })
    .promise()
}

function saveFileToS3(filePath, targetFilePath) {
  const fileContent = fs.readFileSync(filePath)
  const params = {
    Bucket: BUCKET_NAME,
    Key: targetFilePath,
    Body: fileContent,
  }
  return s3bucket.upload(params, (err, data) => {
    if (err) {
      throw err
    }
    console.log(`Frame uploaded to s3: ${data.Location}`)
    return data
  })
}

module.exports = {
  s3bucket,
  saveFileToS3,
  sendFileFromS3,
  fileExistsOnS3,
}
