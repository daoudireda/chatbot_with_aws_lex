# Chatbot with AWS Lex

## Overview

This project is a simple chatbot application built using Next.js and AWS Lex. It allows users to interact with a chatbot powered by Amazon Lex, which can understand and respond to user messages. The application is designed to demonstrate how to integrate AWS Lex into a web application, providing a seamless user experience.

## Features

- User-friendly interface for chatting with the bot.
- Voice recognition capabilities for input. (to develop)
- Real-time responses from the AWS Lex bot.
- Health check endpoint to validate the bot's configuration.

## Technologies Used

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express, AWS SDK
- **Database**: None (state is managed in-memory)
- **Deployment**: AWS Lex for chatbot functionality

## Getting Started

### Prerequisites

- Node.js (v20)
- npm
- AWS account with access to Amazon Lex
- NextJs
- TailwindCSS
- Shadcn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/chatbot_with_aws_lex.git
   cd chatbot_with_aws_lex
   ```

2. Install dependencies for both frontend and backend:

   ```bash
   cd src
   npm install
   cd ../backend
   npm install
   ```

3. Create a `.env` file in the `backend` directory and add your AWS credentials and Lex bot configuration:

   ```plaintext
   AWS_REGION=your_aws_region
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   BOT_ID=your_bot_id
   BOT_ALIAS_ID=your_bot_alias_id
   LOCALE_ID=your_locale_id
   ```

### Running the Application

1. Start the backend server:

   ```bash
   cd backend
   npm start
   ```

2. Start the frontend application:

   ```bash
   cd src
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000/chatbot` to interact with the chatbot.

## Creating a Bot on Amazon Lex

To create a bot on Amazon Lex, follow these steps:

1. **Sign in to the AWS Management Console** and open the Amazon Lex console.

2. **Create a new bot**:
   - Click on "Create bot".
   - Choose "Custom bot" and click "Next".

3. **Configure the bot settings**:
   - **Bot name**: Enter a name for your bot.
   - **Output voice**: Select a voice for the bot (optional).
   - **Session timeout**: Set the session timeout duration.
   - **IAM role**: Create a new role or select an existing role that has permissions to access Amazon Lex.

4. **Define intents**:
   - Click on "Create intent".
   - Enter a name for the intent.
   - Add sample utterances that users might say to trigger this intent.
   - Define the responses that the bot should provide.

5. **Configure the bot's locale**:
   - Set the locale for your bot (e.g., en-US).

6. **Build the bot**:
   - Click on "Build" to create the bot.

7. **Test the bot**:
   - Use the built-in test window to interact with your bot and ensure it responds correctly.

8. **Deploy the bot**:
   - Once you are satisfied with the bot's performance, you can integrate it with your application using the AWS SDK.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

## Acknowledgments

- [Amazon Lex Documentation](https://docs.aws.amazon.com/lex/latest/dg/what-is.html) for detailed information on creating and managing bots.
- [Next.js Documentation](https://nextjs.org/docs) for guidance on building applications with Next.js.
