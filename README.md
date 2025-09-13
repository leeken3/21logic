# 21Logic: Blackjack Simulation Engine

## Project Description
This is a simple Blackjack simulator engine implemented using Spring Boot as the main framework. The application simulates a hand of Blackjack and provides basic strategy recommendations based on the player's hand and the dealer's upcard.
The user is also able to interactively play out the hand against the dealer. The application provides insights into the probabilities of busting for both the player and the dealer, as well as an analysis of the dealer's upcard.
This application was developed as a personal project to enhance my understanding of Spring Boot as a back-end framework, Java programming, JUnit automated testing, and cloud deployment on Amazon Web Services (AWS).

## Key Features
- Provides basic strategy recommendations such as hit, stand, double down, and split
- Provides player and dealer's bust probability
- Provides dealer's upcard analysis
- Provides an explanation of the basic strategy recommendation
- Interactive gameplay against the dealer with options to hit, stand, double down, and split

## Technologies Used
For this project, I wanted to explore and learn more about Spring Boot, so I chose it as the primary framework. The project also utilizes:

### Front-end
- Thymeleaf: For server-side rendering of HTML templates
- Bootstrap (v5.36): For responsive and modern UI design
- HTML5: For structuring the web pages
- CSS3 (5.01): For styling the web pages
- JavaScript (ECMAScript 2024): For client-side interactivity

### Back-end
- Java (v17): The main programming language used for the application logic
- Spring Boot (v3.2.4): For building the web application and handling HTTP requests
- Spring MVC: For implementing the Model-View-Controller architecture
- JPA (Java Persistence API): For database interactions and ORM (Object-Relational Mapping)
- Maven: For project management and dependency management
- JUnit5: For unit testing the application components
- Mockito: For mocking dependencies in unit tests
- Spring Boot Starter Web & Thymeleaf: For web and template support, RESTful services
- Spring Boot DevTools: For development-time features like automatic restarts and live reload

### Deployment
- AWS Elastic Beanstalk (2025): For deploying and managing the application in the cloud
- AWS EC2 (Elastic Compute Cloud): For hosting the application server
- AWS S3 (Simple Storage Service): For storing static assets and backups
- AWS CloudWatch: For monitoring and logging application performance
- AWS IAM (Identity and Access Management): For managing access to AWS resources
- AWS Route 53: For domain name management and routing traffic to the application
- AWS CloudFormation: For automating the deployment and management of AWS resources

### Project Management
- Git (2025): Version control system for tracking changes in the codebase
- GitHub (2025): Hosting platform for the Git repository
- Eclipse IDE (2025-09) : Integrated Development Environment for coding and debugging
- Postman (v10.18.1): For testing and debugging RESTful APIs

## Usage
- Visit the deployed application at: http://21logicapplication-env.eba-gqaqabce.us-east-2.elasticbeanstalk.com/
- Input the player's hand and dealer's upcard
- Click "Get Recommendation" to receive a basic strategy recommendation, bust probabilities, and dealer upcard analysis
- Optionally, play out the hand interactively against the dealer

## Installation
- Ensure you have Java 17 and Maven installed on your machine.
- Clone the repository: git clone
- Navigate to the project directory: `cd BlackJackStack`
- Build the project using Maven: `mvn clean install`
- Run the application: `mvn spring-boot:run`
- Access the application in your web browser at `http://localhost:8080`

## Project Structure
The project follows a standard Maven project structure:
- `src/main/java/com/BlackJackStack/demo`: Contains the main application class and configuration files.
- `src/main/java/com/BlackJackStack/demo/controller`: Contains the Spring MVC controllers that handle HTTP requests and responses.
- `src/main/java/com/BlackJackStack/demo/service`: Contains the service layer that encapsulates the business logic of the application.
- `src/main/java/com/BlackJackStack/demo/model`: Contains the data models representing the entities in the application.
- `src/main/resources/static`: Contains static assets such as CSS, JavaScript, and images.
- `src/main/resources/templates`: Contains Thymeleaf HTML templates for rendering views.
- `src/main/resources/application.properties`: Contains application configuration settings.
- `src/test/java`: Contains unit tests for the application components.
- `aws`: Contains AWS CloudFormation templates and deployment scripts.
- `target`: Contains the compiled application and build artifacts.
- `pom.xml`: Maven configuration file that manages project dependencies and build settings.
- `README.md`: Project documentation and instructions.
- `.gitignore`: Specifies files and directories to be ignored by Git.
- `application.properties`: Configuration file for Spring Boot application settings.

## Limitations and Future Enhancements

### Limitations
- The current implementation does not include advanced betting strategies or side bets.
- The user interface is basic and could be improved for better user experience. The focus of this project was primarily on back-end functionality and not front-end design.
- The simulation does not account for multiple players or complex game rules variations.
- The application currently runs in a single-threaded mode, which may limit performance for large simulations.
- The application does not include a database for storing historical game data, user profiles, authentication, or account management.
- The application does not currently support mobile responsiveness or accessibility features.

### Future Enhancements
- Implement advanced betting strategies, side bets, insurance options, surrender options, and multi-deck support.
- Include Blackjack variants such as Spanish 21, Free Bet Blackjack, Double Down Madness and more.
- Improve the user interface with more interactive elements and better design.
- Include a database to store historical game data and player statistics.
- Implement user authentication, session management, and account features.

## Acknowledgements
- Special thanks to the Spring Boot community and documentation for their invaluable resources and support.
- Thanks to AWS for providing comprehensive documentation and tutorials on deploying applications in the cloud.

## About Me
- Name: Ken Lee
- Email: klee474@my.bcit.ca
- GitHub: https://github.com/leeken3

I am a passionate first year software developer studying at BCIT in the Computer Systems Technology program. I have a strong interest and desire to learn more about
back-end development, particularly in Java and Spring Boot. This personal project is a reflection of my enthusiasm for coding and my commitment 
to continuous learning and improvement in the field of software development. I learned plenty of new skills while working on this project as well as encountering
and overcoming various challenges. Feel free to explore the code, provide feedback, or contribute to the project!
