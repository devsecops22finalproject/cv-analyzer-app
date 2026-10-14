pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out application repository...'
                checkout scm
            }
        }

        stage('Verify') {
            steps {
                sh 'ls -la'
                echo 'Application repository checkout completed!'
            }
        }
    }
}
