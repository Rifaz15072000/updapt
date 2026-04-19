// // ════════════════════════════════════════════════════════════════════════
// // Jenkinsfile  (Declarative Pipeline)
// // CI/CD Pipeline — Jenkins on Windows Server 2022 (Single VM Setup)
// //
// // Repo structure (flat — no frontend/ or backend/ subfolders):
// //   Dockerfile        → frontend image  (serves index.html via nginx)
// //   Dockerfile (1)    → backend image   (Node.js/Express with /health)
// //   index.html        → frontend static page
// //   server.js         → backend Express app
// //   docker-compose.yml
// //   nginx/nginx.conf
// //   Jenkinsfile
// //
// // Setup:
// //   - Jenkins        : Windows Server 2022 EC2 (same machine)
// //   - Docker Runtime : Mirantis Container Runtime (MCR)
// //   - Docker Hub     : rifaz15072000
// //   - Deploy Target  : localhost (same machine)
// //
// // Required Jenkins Credential:
// //   DOCKER_HUB_TOKEN — Secret text — your Docker Hub Access Token
// // ════════════════════════════════════════════════════════════════════════

// pipeline {

//     agent any

//     environment {
//         DOCKER_HUB_USERNAME = 'rifaz15072000'
//         DOCKER_HUB_TOKEN    = credentials('dockerhub-creds')

//         FRONTEND_IMAGE = 'rifaz15072000/cicd-frontend'
//         BACKEND_IMAGE  = 'rifaz15072000/cicd-backend'

//         // Tag = Jenkins build number + short commit SHA
//         IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'latest'}"

//         // Project folder on this Windows machine (docker-compose.yml lives here)
//         PROJECT_DIR = 'C:\\cicd-project'
//     }

//     triggers {
//         pollSCM('H/2 * * * *')
//     }

//     stages {

//         // ── STAGE 1: SOURCE ───────────────────────────────────────────
//         stage('Source') {
//             steps {
//                 echo "============================================"
//                 echo " CI/CD Pipeline Starting"
//                 echo " Build     : #${env.BUILD_NUMBER}"
//                 echo " Commit    : ${env.GIT_COMMIT?.take(7) ?: 'N/A'}"
//                 echo " Image Tag : ${IMAGE_TAG}"
//                 echo "============================================"
//                 bat 'dir'
//             }
//         }

//         // ── STAGE 2: BUILD ────────────────────────────────────────────
//         // Files are flat in repo root — no frontend/ or backend/ folders.
//         // We use -f to point at specific Dockerfiles and . as build context.
//         //
//         // NOTE: Your repo has "Dockerfile" and "Dockerfile (1)".
//         //   Rename them in GitHub to:
//         //     Dockerfile.frontend  → for the frontend (nginx serving index.html)
//         //     Dockerfile.backend   → for the backend  (Node.js server.js)
//         //   Then this stage will work correctly.
//         //
//         //   If you cannot rename right now, see the fallback approach below.
//         stage('Build') {
//             steps {
//                 echo "Building Docker images — tag: ${IMAGE_TAG}"

//                 // ── Build Frontend image ──────────────────────────────
//                 // Uses Dockerfile.frontend in repo root
//                 // Build context is . (whole workspace) so index.html is accessible
//                 bat """
//                     docker build ^
//                         -f Dockerfile.frontend ^
//                         -t %FRONTEND_IMAGE%:%IMAGE_TAG% ^
//                         -t %FRONTEND_IMAGE%:latest ^
//                         .
//                 """

//                 // ── Build Backend image ───────────────────────────────
//                 // Uses Dockerfile.backend in repo root
//                 // Build context is . so server.js and package.json are accessible
//                 bat """
//                     docker build ^
//                         -f Dockerfile.backend ^
//                         -t %BACKEND_IMAGE%:%IMAGE_TAG% ^
//                         -t %BACKEND_IMAGE%:latest ^
//                         .
//                 """

//                 echo "Both images built successfully"
//                 bat 'docker images | findstr rifaz15072000'
//             }
//         }

//         // ── STAGE 3: PUSH ─────────────────────────────────────────────
//         stage('Push') {
//             steps {
//                 echo "Logging in to Docker Hub and pushing images..."

//                 bat "echo %DOCKER_HUB_TOKEN% | docker login -u %DOCKER_HUB_USERNAME% --password-stdin"

//                 bat """
//                     docker push %FRONTEND_IMAGE%:%IMAGE_TAG%
//                     docker push %FRONTEND_IMAGE%:latest
//                 """

//                 bat """
//                     docker push %BACKEND_IMAGE%:%IMAGE_TAG%
//                     docker push %BACKEND_IMAGE%:latest
//                 """

//                 echo "Images pushed to Docker Hub successfully"
//             }
//             post {
//                 always {
//                     bat 'docker logout'
//                 }
//             }
//         }

//         // ── STAGE 4: DEPLOY ───────────────────────────────────────────
//         // Jenkins is on the same machine — run docker compose directly.
//         // docker-compose.yml lives in C:\cicd-project\ on this VM.
//         stage('Deploy') {
//             steps {
//                 echo "Deploying containers on localhost..."

//                 bat """
//                     cd /d %PROJECT_DIR%
//                     set DOCKER_HUB_USERNAME=%DOCKER_HUB_USERNAME%
//                     set IMAGE_TAG=%IMAGE_TAG%
//                     docker compose pull
//                 """

//                 bat """
//                     cd /d %PROJECT_DIR%
//                     set DOCKER_HUB_USERNAME=%DOCKER_HUB_USERNAME%
//                     set IMAGE_TAG=%IMAGE_TAG%
//                     docker compose up -d --force-recreate
//                 """

//                 bat "docker compose -f %PROJECT_DIR%\\docker-compose.yml ps"

//                 bat 'docker image prune -f'

//                 echo "Containers restarted successfully"
//             }
//         }

//         // ── STAGE 5: VERIFY ───────────────────────────────────────────
//         stage('Verify') {
//             steps {
//                 echo "Running post-deployment health check..."

//                 bat 'if not exist C:\\Temp mkdir C:\\Temp'

//                 sleep(time: 20, unit: 'SECONDS')

//                 script {
//                     def healthUrl  = 'http://localhost/api/health'
//                     def maxRetries = 5
//                     def passed     = false

//                     for (int i = 1; i <= maxRetries; i++) {
//                         echo "Attempt ${i}/${maxRetries} — GET ${healthUrl}"

//                         def rawOut = bat(
//                             script: "curl.exe -s -o C:\\Temp\\health_response.json -w \"%%{http_code}\" ${healthUrl}",
//                             returnStdout: true
//                         ).trim()

//                         def statusCode = rawOut.readLines().last().trim()
//                         echo "HTTP Status: ${statusCode}"

//                         if (statusCode == '200') {
//                             echo "Health check PASSED"
//                             bat 'type C:\\Temp\\health_response.json'
//                             passed = true
//                             break
//                         }

//                         if (i < maxRetries) {
//                             echo "Retrying in 10 seconds..."
//                             sleep(time: 10, unit: 'SECONDS')
//                         }
//                     }

//                     if (!passed) {
//                         error("HEALTH CHECK FAILED after ${maxRetries} attempts. Run: docker compose -f C:\\cicd-project\\docker-compose.yml logs")
//                     }
//                 }
//             }
//         }
//     }

//     post {
//         success {
//             echo "============================================"
//             echo " PIPELINE SUCCEEDED — Build #${env.BUILD_NUMBER}"
//             echo " App    : http://localhost"
//             echo " Health : http://localhost/api/health"
//             echo "============================================"
//         }
//         failure {
//             echo "============================================"
//             echo " PIPELINE FAILED — Build #${env.BUILD_NUMBER}"
//             echo " Run: docker compose -f C:\\cicd-project\\docker-compose.yml logs"
//             echo "============================================"
//         }
//         always {
//             cleanWs()
//         }
//     }
// }


pipeline {

    agent any

    environment {
        // ✅ Docker Hub credentials (Username + Access Token)
        DOCKER_CREDS = credentials('dockerhub-creds')

        FRONTEND_IMAGE = 'rifaz15072000/cicd-frontend'
        BACKEND_IMAGE  = 'rifaz15072000/cicd-backend'

        IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'latest'}"

        PROJECT_DIR = 'C:\\cicd-project'
    }

    triggers {
        pollSCM('H/2 * * * *')
    }

    stages {

        // ─────────────────────────────
        // STAGE 1: SOURCE
        // ─────────────────────────────
        stage('Source') {
            steps {
                echo "============================================"
                echo " CI/CD Pipeline Starting"
                echo " Build     : #${env.BUILD_NUMBER}"
                echo " Commit    : ${env.GIT_COMMIT?.take(7) ?: 'N/A'}"
                echo " Image Tag : ${IMAGE_TAG}"
                echo "============================================"
                bat 'dir'
            }
        }

        // ─────────────────────────────
        // STAGE 2: BUILD
        // ─────────────────────────────
        stage('Build') {
            steps {
                echo "Building Docker images — tag: ${IMAGE_TAG}"

                bat """
                    docker build ^
                        -f Dockerfile.frontend ^
                        -t %FRONTEND_IMAGE%:%IMAGE_TAG% ^
                        -t %FRONTEND_IMAGE%:latest ^
                        .
                """

                bat """
                    docker build ^
                        -f Dockerfile.backend ^
                        -t %BACKEND_IMAGE%:%IMAGE_TAG% ^
                        -t %BACKEND_IMAGE%:latest ^
                        .
                """

                echo "Images built successfully"
                bat 'docker images | findstr rifaz15072000'
            }
        }

        // ─────────────────────────────
        // STAGE 3: PUSH
        // ─────────────────────────────
        stage('Push') {
            steps {
                echo "Logging in to Docker Hub..."

                bat """
                    echo %DOCKER_CREDS_PSW% | docker login -u %DOCKER_CREDS_USR% --password-stdin
                """

                echo "Pushing frontend image..."
                bat """
                    docker push %FRONTEND_IMAGE%:%IMAGE_TAG%
                    docker push %FRONTEND_IMAGE%:latest
                """

                echo "Pushing backend image..."
                bat """
                    docker push %BACKEND_IMAGE%:%IMAGE_TAG%
                    docker push %BACKEND_IMAGE%:latest
                """

                echo "Images pushed successfully"
            }
            post {
                always {
                    bat 'docker logout'
                }
            }
        }

        // ─────────────────────────────
        // STAGE 4: DEPLOY
        // ─────────────────────────────
        stage('Deploy') {
            steps {
                echo "Deploying containers..."

                bat """
                    cd /d %PROJECT_DIR%
                    set DOCKER_HUB_USERNAME=%DOCKER_CREDS_USR%
                    set IMAGE_TAG=%IMAGE_TAG%
                    docker compose pull
                """

                bat """
                    cd /d %PROJECT_DIR%
                    set DOCKER_HUB_USERNAME=%DOCKER_CREDS_USR%
                    set IMAGE_TAG=%IMAGE_TAG%
                    docker compose up -d --force-recreate
                """

                bat "docker compose -f %PROJECT_DIR%\\docker-compose.yml ps"

                bat 'docker image prune -f'

                echo "Deployment completed"
            }
        }

        // ─────────────────────────────
        // STAGE 5: VERIFY
        // ─────────────────────────────
        stage('Verify') {
            steps {
                echo "Running health check..."

                bat 'if not exist C:\\Temp mkdir C:\\Temp'

                sleep(time: 20, unit: 'SECONDS')

                script {
                    def url = 'http://localhost/api/health'
                    def retries = 5
                    def success = false

                    for (int i = 1; i <= retries; i++) {
                        echo "Attempt ${i}/${retries}"

                        def status = bat(
                            script: "curl.exe -s -o C:\\Temp\\health.json -w \"%%{http_code}\" ${url}",
                            returnStdout: true
                        ).trim().readLines().last()

                        echo "HTTP Status: ${status}"

                        if (status == '200') {
                            echo "Health check PASSED"
                            bat 'type C:\\Temp\\health.json'
                            success = true
                            break
                        }

                        sleep(time: 10, unit: 'SECONDS')
                    }

                    if (!success) {
                        error("Health check FAILED")
                    }
                }
            }
        }
    }

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
