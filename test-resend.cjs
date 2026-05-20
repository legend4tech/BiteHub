const { Resend } = require('resend');
const resend = new Resend('re_Yj8hC73x_3oMWXFy5j86BaQj9PPtfgoiv');

async function test() {
  const result = await resend.emails.send({
    from: 'BiteHub <no-reply@mail.bitehubapp.com>',
    to: 'random-unverified@example.com',
    subject: 'Test',
    html: '<p>Test</p>'
  });
  console.log(JSON.stringify(result, null, 2));
}
test();
