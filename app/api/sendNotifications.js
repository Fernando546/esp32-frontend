import webpush from '../../lib/web-push-config'; // Import your configuration

export async function POST(request) {
  try {
    const subscription = await request.json();
    const payload = JSON.stringify({
      title: 'Notification Title',
      body: 'Notification Body',
    });

    await webpush.sendNotification(subscription, payload);
    return new Response('Notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response('Error sending notification', { status: 500 });
  }
}
