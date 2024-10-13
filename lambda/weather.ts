import axios from 'axios';
import { S3 } from 'aws-sdk';
import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const s3 = new S3();

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const city = event.pathParameters?.city;
  if (!city) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'City not provided' }),
    };
  }

  try {
    // Fetch weather data
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}`);
    const weatherData = response.data;

    const bucketName = process.env.S3_BUCKET_NAME;
if (!bucketName) {
  throw new Error('S3_BUCKET_NAME environment variable is not set');
}

    // Save the response in S3
    const s3Params = {
      Bucket: bucketName,
      Key: `weather/${city}/current.json`,
      Body: JSON.stringify(weatherData),
      ContentType: 'application/json',
    };
    await s3.putObject(s3Params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(weatherData),
    };
  } catch (error: unknown) {
    const message = (error as Error).message || 'Unknown error';
    return {
      statusCode: 500,
      body: JSON.stringify({ message}),
    };
  }
};
