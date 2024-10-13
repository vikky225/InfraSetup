import { S3 } from 'aws-sdk';
import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult }  from 'aws-lambda';

const s3 = new S3();
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const city = event.pathParameters?.city;
  if (!city) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'City not provided' }),
    };
  }
  const bucketName = process.env.S3_BUCKET_NAME;
if (!bucketName) {
  throw new Error('S3_BUCKET_NAME environment variable is not set');
}

  try {
    const s3Params = {
      Bucket: bucketName,
      Key: `weather/${city}/current.json`,
    };

    const data = await s3.getObject(s3Params).promise();
    const weatherData = data.Body?.toString('utf-8');

    return {
      statusCode: 200,
      body: JSON.stringify(weatherData),
    };
  } catch (error:unknown) {
    const message = (error as Error).message || 'Unknown error';
    return {
      statusCode: 500,
      body: JSON.stringify({ message }),
    };
  }
};
