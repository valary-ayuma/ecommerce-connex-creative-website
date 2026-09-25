Connex Creative — Custom Merchandise E-Commerce Website

Live Site

connex-creative-brands.netlify.app

An e-commerce website for a client selling customizable branded merchandise — apparel, drinkware, bags, and promotional items — with individual product pages, a cart, user accounts, and a bulk-order quote system.

Overview

Built end-to-end for a freelance client, this site lets customers browse a catalog of customizable products, add items to a cart, create an account, and either check out directly or request a quote for bulk/corporate orders. Backend logic — including SMS notifications — lives in the api/ directory, built with Node.js.

Tech Stack

Back-end: Node.js (api/server.js, api/smsService.js)
Database: MySQL
Front-end: HTML, CSS, JavaScript
Version control: Git / GitHub
Features
Product catalog: individual pages per item — apparel (shirt, hoodie, cape), drinkware (mug, cup, bottle), bags, accessories (bracelet, umbrella, pen), and more
Cart & bag: add-to-cart flow with a dedicated cart/bag view
Accounts: sign-in and sign-up pages for returning customers
Customize Order: a dedicated flow for customers to configure a product before ordering, with file uploads supported (api/uploads)
Request a Quote: a separate path for bulk/corporate orders that need custom pricing
SMS Notifications: smsService.js handles SMS-based notifications (e.g. order or quote confirmations) from the backend
FAQ, Privacy, and Terms pages

Project Structure

ecommerce-connex-creative-website/
├── api/                     # Node.js backend
│   ├── node_modules/
│   ├── uploads/              # files uploaded via the customize-order flow
│   ├── .env                  # environment config (not committed — see below)
│   ├── package.json / package-lock.json
│   ├── server.js             # entry point
│   └── smsService.js         # SMS notification logic
├── index.html
├── product.html
├── cart.html / bag.html
├── signin.html / signup.html
├── customize_order.html
├── request_quote.html
├── faq.html
├── about.html / contact.html
├── privacy.html / terms.html
├── (per-product pages: shirt, hoodie, mug, cup, bottle, bag, bracelet,
│    cape, calender, pen, umbrella, trail, book — each with matching image)
├── header.js
├── style.css
└── logo.png

Getting Started

To run this project locally:

bash
git clone https://github.com/valary-ayuma/ecommerce-connex-creative-website.git
cd ecommerce-connex-creative-website/api
npm install

Create a .env file inside api/ with your own configuration (database credentials, SMS provider credentials, and any other secrets server.js and smsService.js expect — do not commit this file).

bash
node server.js

Then open index.html from the project root (or serve it with a local static server) to browse the storefront.

ngrok is used during local development to expose the API for testing callbacks that need a public URL (e.g. SMS provider webhooks). It's optional for basic local development — only needed if you're testing those callback flows.
