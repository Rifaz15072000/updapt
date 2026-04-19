pipeline {

    agent { label 'windows-agent' }

    environment {
        DOCKER_HUB = "rifaz15072000"
        FRONTEND_IMAGE = 'rifaz15072000/cicd-frontend'
        BACKEND_IMAGE  = 'rifaz15072000/cicd-backend'
        TAG = "${BUILD_NUMBER}"
    }

    // stages {

    //     // ───────── SOURCE ─────────
    //     stage('Source') {
    //         steps {
    //             echo "============================================"
    //             echo " CI/CD Pipeline Starting"
    //             echo " Build     : #${env.BUILD_NUMBER}"
    //             echo " Commit    : ${env.GIT_COMMIT?.take(7) ?: 'N/A'}"
    //             echo " Image Tag : ${IMAGE_TAG}"
    //             echo "============================================"
    //             bat 'dir'
    //         }
    //     }

        // ───────── BUILD ─────────
    stages {

stage('Build Images') {
    steps {
        bat """
        docker build -f Dockerfile.backend -t %BACKEND_IMAGE%:%TAG% .
        docker build -f Dockerfile.frontend -t %FRONTEND_IMAGE%:%TAG% .

        docker tag %BACKEND_IMAGE%:%TAG% %BACKEND_IMAGE%:latest
        docker tag %FRONTEND_IMAGE%:%TAG% %FRONTEND_IMAGE%:latest
        """
    }
}

        // ───────── PUSH ─────────
        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    
                    bat """
                    docker login -u %USER% -p %PASS%

                    docker push %BACKEND_IMAGE%:%TAG%
                    docker push %FRONTEND_IMAGE%:%TAG%

                    docker push %BACKEND_IMAGE%:latest
                    docker push %FRONTEND_IMAGE%:latest
                    """
                }
            }
        }
        

        // ───────── DEPLOY ─────────
stage('Deploy') {
    steps {
        bat """
        set DOCKER_HUB_USERNAME=rifaz15072000

        docker rm -f backend || exit 0
        docker rm -f frontend || exit 0
        docker rm -f nginx || exit 0

        docker-compose down

        docker pull %DOCKER_HUB_USERNAME%/cicd-backend:latest
        docker pull %DOCKER_HUB_USERNAME%/cicd-frontend:latest

        docker-compose up -d
        """
    }
}

        stage('Health Check') {
            steps {
                script {
                    timeout(time: 2, unit: 'MINUTES') {
                        bat "curl -f http://localhost/api/health"
                    }
                }
            }
        }

        // ───────── VERIFY ─────────
        stage('Verify') {
            steps {
                echo "Running health check..."

                bat 'if not exist C:\\Temp mkdir C:\\Temp'
                sleep 20

                script {
                    def url = "http://localhost/api/health"
                    def success = false

                    for (int i = 1; i <= 5; i++) {
                        echo "Attempt ${i}..."

                        def status = bat(
                            script: "curl.exe -s -o C:\\Temp\\health.json -w \"%%{http_code}\" ${url}",
                            returnStdout: true
                        ).trim().readLines().last()

                        echo "HTTP Status: ${status}"

                        if (status == "200") {
                            echo "Health check PASSED"
                            bat 'type C:\\Temp\\health.json'
                            success = true
                            break
                        }

                        sleep 10
                    }

                    if (!success) {
                        error("Health check FAILED")
                    }
                }
            }
        }
    }

    // ───────── POST ─────────
    post {
        success {
            echo "============================================"
            echo " PIPELINE SUCCESS — Build #${env.BUILD_NUMBER}"
            echo " App    : http://localhost"
            echo " Health : http://localhost/api/health"
            echo "============================================"
        }

        failure {
            echo "============================================"
            echo " PIPELINE FAILED — Build #${env.BUILD_NUMBER}"
            echo " Run: docker compose -f C:\\cicd-project\\docker-compose.yml logs"
            echo "============================================"
        }

        always {
            cleanWs()
        }
    }
}
