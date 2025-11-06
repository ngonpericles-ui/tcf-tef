"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateService = void 0;
const connection_1 = require("@/database/connection");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const emailService_1 = require("./emailService");
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class CertificateService {
    static async generateCertificate(request) {
        try {
            const user = await connection_1.prisma.user.findUnique({
                where: { id: request.userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            });
            if (!user) {
                throw new errors_1.NotFoundError('User not found');
            }
            const verificationCode = this.generateVerificationCode();
            const issuedAt = new Date();
            const validUntil = request.validityPeriod
                ? new Date(issuedAt.getTime() + request.validityPeriod * 30 * 24 * 60 * 60 * 1000)
                : undefined;
            const certificateUrl = await this.createPDFCertificate({
                ...request,
                userName: `${user.firstName} ${user.lastName}`,
                userEmail: user.email,
                issuedAt,
                validUntil,
                verificationCode
            });
            const certificate = await connection_1.prisma.certificate.create({
                data: {
                    userId: request.userId,
                    type: request.type,
                    title: request.title,
                    description: request.description,
                    level: request.level,
                    score: request.score,
                    percentage: request.percentage,
                    courseName: request.courseName,
                    testName: request.testName,
                    instructorName: request.instructorName,
                    issuedAt,
                    validUntil,
                    certificateUrl,
                    verificationCode,
                    metadata: JSON.stringify(request.metadata || {})
                }
            });
            const certificateData = {
                id: certificate.id,
                userId: certificate.userId,
                type: certificate.type,
                title: certificate.title,
                description: certificate.description,
                level: certificate.level || undefined,
                score: certificate.score || undefined,
                percentage: certificate.percentage || undefined,
                courseName: certificate.courseName || undefined,
                testName: certificate.testName || undefined,
                instructorName: certificate.instructorName || undefined,
                issuedAt: certificate.issuedAt,
                validUntil: certificate.validUntil || undefined,
                certificateUrl: certificate.certificateUrl,
                verificationCode: certificate.verificationCode,
                metadata: JSON.parse(certificate.metadata)
            };
            await this.sendCertificateEmail(user, certificateData);
            logger_1.logger.info('Certificate generated successfully', {
                certificateId: certificate.id,
                userId: request.userId,
                type: request.type,
                verificationCode
            });
            return certificateData;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate certificate', { request, error });
            throw error;
        }
    }
    static async createPDFCertificate(data) {
        try {
            const fileName = `certificate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`;
            const certificatesDir = path_1.default.join(process.cwd(), 'uploads', 'certificates');
            if (!fs_1.default.existsSync(certificatesDir)) {
                fs_1.default.mkdirSync(certificatesDir, { recursive: true });
            }
            const filePath = path_1.default.join(certificatesDir, fileName);
            const doc = new pdfkit_1.default({
                size: 'A4',
                layout: 'landscape',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });
            doc.pipe(fs_1.default.createWriteStream(filePath));
            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;
            const centerX = pageWidth / 2;
            doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
                .strokeColor('#2C3E50')
                .lineWidth(3)
                .stroke();
            doc.rect(50, 50, pageWidth - 100, pageHeight - 100)
                .strokeColor('#3498DB')
                .lineWidth(1)
                .stroke();
            doc.fontSize(36)
                .fillColor('#2C3E50')
                .font('Helvetica-Bold')
                .text('CERTIFICAT DE RÉUSSITE', 0, 100, { align: 'center' });
            doc.fontSize(18)
                .fillColor('#7F8C8D')
                .font('Helvetica')
                .text('TCF/TEF Learning Platform', 0, 140, { align: 'center' });
            doc.moveTo(centerX - 150, 170)
                .lineTo(centerX + 150, 170)
                .strokeColor('#3498DB')
                .lineWidth(2)
                .stroke();
            doc.fontSize(16)
                .fillColor('#2C3E50')
                .font('Helvetica')
                .text('Ceci certifie que', 0, 200, { align: 'center' });
            doc.fontSize(32)
                .fillColor('#E74C3C')
                .font('Helvetica-Bold')
                .text(data.userName.toUpperCase(), 0, 230, { align: 'center' });
            doc.fontSize(16)
                .fillColor('#2C3E50')
                .font('Helvetica')
                .text('a réussi avec succès', 0, 280, { align: 'center' });
            doc.fontSize(24)
                .fillColor('#27AE60')
                .font('Helvetica-Bold')
                .text(data.title, 0, 310, { align: 'center' });
            if (data.level) {
                doc.fontSize(18)
                    .fillColor('#8E44AD')
                    .font('Helvetica-Bold')
                    .text(`Niveau: ${data.level}`, 0, 350, { align: 'center' });
            }
            if (data.score && data.percentage) {
                doc.fontSize(16)
                    .fillColor('#2C3E50')
                    .font('Helvetica')
                    .text(`Score: ${data.score} points (${data.percentage}%)`, 0, 380, { align: 'center' });
            }
            doc.fontSize(14)
                .fillColor('#34495E')
                .font('Helvetica')
                .text(data.description, 100, 420, {
                width: pageWidth - 200,
                align: 'center'
            });
            const bottomY = pageHeight - 150;
            doc.fontSize(12)
                .fillColor('#7F8C8D')
                .font('Helvetica')
                .text(`Délivré le: ${data.issuedAt.toLocaleDateString('fr-FR')}`, 100, bottomY);
            if (data.validUntil) {
                doc.text(`Valide jusqu'au: ${data.validUntil.toLocaleDateString('fr-FR')}`, 100, bottomY + 20);
            }
            if (data.instructorName) {
                doc.text(`Instructeur: ${data.instructorName}`, pageWidth - 300, bottomY, { width: 200 });
            }
            doc.fontSize(10)
                .fillColor('#95A5A6')
                .font('Helvetica')
                .text(`Code de vérification: ${data.verificationCode}`, 0, pageHeight - 80, { align: 'center' });
            doc.text('Vérifiez ce certificat sur: https://tcf-tef-platform.com/verify', 0, pageHeight - 65, { align: 'center' });
            doc.end();
            const certificateUrl = `/uploads/certificates/${fileName}`;
            logger_1.logger.info('PDF certificate created', {
                fileName,
                userName: data.userName,
                type: data.type
            });
            return certificateUrl;
        }
        catch (error) {
            logger_1.logger.error('Failed to create PDF certificate', { data, error });
            throw error;
        }
    }
    static async sendCertificateEmail(user, certificate) {
        try {
            const subject = `🎓 Félicitations! Votre certificat "${certificate.title}" est prêt`;
            const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #27AE60 0%, #2ECC71 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #27AE60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .certificate-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #27AE60; }
              .achievement { background: #E8F8F5; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🎓 Félicitations ${user.firstName}!</h1>
                  <p>Votre certificat est prêt</p>
              </div>
              <div class="content">
                  <h2>Bravo pour votre réussite!</h2>
                  
                  <p>Nous sommes fiers de vous délivrer votre certificat de réussite. Votre travail acharné et votre détermination ont porté leurs fruits!</p>
                  
                  <div class="certificate-info">
                      <h3>📜 Détails du certificat:</h3>
                      <p><strong>Titre:</strong> ${certificate.title}</p>
                      <p><strong>Description:</strong> ${certificate.description}</p>
                      ${certificate.level ? `<p><strong>Niveau atteint:</strong> ${certificate.level}</p>` : ''}
                      ${certificate.percentage ? `<p><strong>Score:</strong> ${certificate.percentage}%</p>` : ''}
                      <p><strong>Date de délivrance:</strong> ${certificate.issuedAt.toLocaleDateString('fr-FR')}</p>
                      ${certificate.validUntil ? `<p><strong>Valide jusqu'au:</strong> ${certificate.validUntil.toLocaleDateString('fr-FR')}</p>` : ''}
                      <p><strong>Code de vérification:</strong> ${certificate.verificationCode}</p>
                  </div>

                  <div class="achievement">
                      <h3>🌟 Votre accomplissement:</h3>
                      <p>Ce certificat atteste de votre maîtrise et de votre progression en français. C'est une étape importante dans votre parcours d'apprentissage!</p>
                  </div>

                  <div style="text-align: center;">
                      <a href="http://localhost:3000${certificate.certificateUrl}" class="button">📥 Télécharger le certificat</a>
                  </div>

                  <p>🎯 <strong>Prochaines étapes:</strong></p>
                  <ul>
                      <li>Partagez votre réussite sur les réseaux sociaux</li>
                      <li>Ajoutez ce certificat à votre CV</li>
                      <li>Continuez votre apprentissage avec de nouveaux défis</li>
                      <li>Explorez les niveaux supérieurs</li>
                  </ul>

                  <p>💡 <strong>Conseil:</strong> Gardez ce certificat précieusement, il témoigne de votre niveau de français!</p>

                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                  
                  <p style="font-size: 14px; color: #666;">
                      Vous pouvez vérifier l'authenticité de ce certificat avec le code: <strong>${certificate.verificationCode}</strong>
                  </p>
                  
                  <p style="font-size: 12px; color: #999;">
                      Toute l'équipe de TCF/TEF Learning Platform vous félicite pour cette réussite!
                  </p>
              </div>
          </div>
      </body>
      </html>`;
            await emailService_1.EmailService.sendEmail({
                to: user.email,
                subject,
                html
            });
            logger_1.logger.info('Certificate email sent', {
                certificateId: certificate.id,
                userEmail: user.email
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to send certificate email', { certificate, user, error });
        }
    }
    static generateVerificationCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 12; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    static async verifyCertificate(verificationCode) {
        try {
            const certificate = await connection_1.prisma.certificate.findUnique({
                where: { verificationCode }
            });
            if (!certificate) {
                return null;
            }
            if (certificate.validUntil && certificate.validUntil < new Date()) {
                logger_1.logger.warn('Certificate verification attempted for expired certificate', {
                    certificateId: certificate.id,
                    verificationCode
                });
                return null;
            }
            logger_1.logger.info('Certificate verified successfully', {
                certificateId: certificate.id,
                verificationCode
            });
            return {
                id: certificate.id,
                userId: certificate.userId,
                type: certificate.type,
                title: certificate.title,
                description: certificate.description,
                level: certificate.level || undefined,
                score: certificate.score || undefined,
                percentage: certificate.percentage || undefined,
                courseName: certificate.courseName || undefined,
                testName: certificate.testName || undefined,
                instructorName: certificate.instructorName || undefined,
                issuedAt: certificate.issuedAt,
                validUntil: certificate.validUntil || undefined,
                certificateUrl: certificate.certificateUrl,
                verificationCode: certificate.verificationCode,
                metadata: JSON.parse(certificate.metadata)
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to verify certificate', { verificationCode, error });
            throw error;
        }
    }
    static async getUserCertificates(userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const [certificates, total] = await Promise.all([
                connection_1.prisma.certificate.findMany({
                    where: { userId },
                    skip,
                    take: limit,
                    orderBy: { issuedAt: 'desc' }
                }),
                connection_1.prisma.certificate.count({ where: { userId } })
            ]);
            const certificateData = certificates.map(cert => ({
                id: cert.id,
                userId: cert.userId,
                type: cert.type,
                title: cert.title,
                description: cert.description,
                level: cert.level || undefined,
                score: cert.score || undefined,
                percentage: cert.percentage || undefined,
                courseName: cert.courseName || undefined,
                testName: cert.testName || undefined,
                instructorName: cert.instructorName || undefined,
                issuedAt: cert.issuedAt,
                validUntil: cert.validUntil || undefined,
                certificateUrl: cert.certificateUrl,
                verificationCode: cert.verificationCode,
                metadata: JSON.parse(cert.metadata)
            }));
            return {
                certificates: certificateData,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get user certificates', { userId, error });
            throw error;
        }
    }
    static async checkAndGenerateAutoCertificates(userId) {
        try {
            const completedCourses = await connection_1.prisma.enrollment.findMany({
                where: {
                    userId,
                    status: 'COMPLETED'
                }
            });
            for (const enrollment of completedCourses) {
                const course = await connection_1.prisma.course.findUnique({
                    where: { id: enrollment.courseId },
                    select: {
                        id: true,
                        title: true,
                        level: true
                    }
                });
                if (!course)
                    continue;
                const existingCert = await connection_1.prisma.certificate.findFirst({
                    where: {
                        userId,
                        type: 'COURSE_COMPLETION',
                        courseName: course.title
                    }
                });
                if (!existingCert) {
                    await this.generateCertificate({
                        userId,
                        type: 'COURSE_COMPLETION',
                        title: `Certificat de Réussite - ${course.title}`,
                        description: `Félicitations! Vous avez terminé avec succès le cours "${course.title}".`,
                        level: course.level,
                        courseName: course.title,
                        validityPeriod: 24
                    });
                }
            }
            logger_1.logger.info('Auto-certificate check completed', { userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to check and generate auto-certificates', { userId, error });
        }
    }
}
exports.CertificateService = CertificateService;
//# sourceMappingURL=certificateService.js.map