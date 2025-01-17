# Use the Node.js image as a base
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# # Install dependencies
# RUN npm install

# Copy the entire app
COPY . .

# Expose the development server port
EXPOSE 3000

# Start the React development server
CMD ["npm", "start"]
