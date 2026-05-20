const React = require('react');
const { render } = require('@react-email/render');

async function test() {
  try {
    // We cannot easily require the tsx files in a node script without transpilation
    console.log("We need a better way to check");
  } catch (e) {
    console.error(e);
  }
}
test();
