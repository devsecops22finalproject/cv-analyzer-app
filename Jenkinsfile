pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out application repository...'
                checkout scm
            }
        }


        stage('Checkout Infrastructure') {
            steps {
                dir('infrastructure') {
                    git branch: 'main',
                        url: 'https://github.com/devsecops22finalproject/cv-analyzer-infra.git'
                    sh 'ls -la'
                }
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
