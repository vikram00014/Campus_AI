import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#f4f8fc",
        padding: 20,
        fontFamily: "Helvetica",
    },
    frameOuter: {
        border: "6pt solid #14325f",
        padding: 10,
        height: "100%",
        width: "100%",
        backgroundColor: "#fffdf8",
    },
    frameInner: {
        border: "1.5pt solid #69bfd9",
        paddingHorizontal: 34,
        paddingVertical: 24,
        height: "100%",
        width: "100%",
        flexDirection: "column",
        backgroundColor: "#fffdfb",
        position: "relative",
    },
    topAccentBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 6,
        backgroundColor: "#0ea5c6",
    },
    topAccentGold: {
        position: "absolute",
        top: 6,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: "#d6a54a",
    },
    sideAccentLeft: {
        position: "absolute",
        top: 12,
        bottom: 12,
        left: 8,
        width: 2,
        backgroundColor: "#d6a54a",
        opacity: 0.8,
    },
    sideAccentRight: {
        position: "absolute",
        top: 12,
        bottom: 12,
        right: 8,
        width: 2,
        backgroundColor: "#d6a54a",
        opacity: 0.8,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1pt solid #bfd0e3",
        paddingBottom: 10,
        marginTop: 6,
        marginBottom: 12,
    },
    leftBrand: {
        flexDirection: "column",
    },
    orgLabel: {
        fontSize: 10,
        letterSpacing: 1.1,
        color: "#0284c7",
        textTransform: "uppercase",
        fontFamily: "Helvetica-Bold",
    },
    orgName: {
        fontSize: 17,
        color: "#0b1e3a",
        letterSpacing: 0.6,
        fontFamily: "Helvetica-Bold",
    },
    verifiedBadge: {
        border: "1pt solid #c9d7e8",
        backgroundColor: "#f8fbff",
        paddingVertical: 4,
        paddingHorizontal: 10,
        fontSize: 10.5,
        textTransform: "uppercase",
        letterSpacing: 0.7,
        color: "#0b1e3a",
        fontFamily: "Helvetica-Bold",
    },
    bodyWrap: {
        flexGrow: 1,
        flexDirection: "column",
        justifyContent: "space-between",
    },
    titleBlock: {
        marginTop: 2,
        marginBottom: 8,
        alignItems: "center",
    },
    certificateTitle: {
        fontSize: 38,
        color: "#0b1e3a",
        fontFamily: "Times-Bold",
        letterSpacing: 0.6,
        textTransform: "uppercase",
    },
    certificateSubTitle: {
        marginTop: 3,
        fontSize: 13.5,
        color: "#0284c7",
        letterSpacing: 1,
        textTransform: "uppercase",
        fontFamily: "Helvetica-Bold",
    },
    middleSection: {
        alignItems: "center",
        marginTop: 4,
    },
    certifyText: {
        fontSize: 14.5,
        color: "#2f4563",
        marginBottom: 8,
    },
    learnerName: {
        fontSize: 34,
        color: "#0b1e3a",
        fontFamily: "Times-Bold",
        borderBottom: "1.5pt solid #0b1e3a",
        paddingBottom: 6,
        marginBottom: 10,
        minWidth: "70%",
        textAlign: "center",
    },
    completedText: {
        fontSize: 13.5,
        color: "#2f4563",
        marginBottom: 6,
    },
    courseWrap: {
        width: "100%",
        border: "1pt solid #c9dff4",
        backgroundColor: "#f0f8ff",
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginBottom: 10,
        borderRadius: 6,
    },
    courseName: {
        textAlign: "center",
        fontSize: 26,
        color: "#0b1e3a",
        fontFamily: "Helvetica-Bold",
    },
    achievementText: {
        fontSize: 11.5,
        color: "#314867",
        textAlign: "center",
        lineHeight: 1.4,
        maxWidth: "90%",
    },
    dividerOrnament: {
        marginTop: 10,
        marginBottom: 6,
        alignItems: "center",
    },
    dividerLine: {
        width: 160,
        borderBottom: "1pt solid #d6a54a",
    },
    dividerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#d6a54a",
        marginTop: 4,
    },
    detailsGrid: {
        marginTop: 12,
        borderTop: "1pt solid #e2e8f0",
        borderBottom: "1pt solid #e2e8f0",
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    detailBox: {
        width: "31%",
        border: "1pt solid #c7d6e8",
        padding: 8,
        backgroundColor: "#f7fbff",
    },
    detailBoxGrade: {
        backgroundColor: "#eef6ff",
        borderColor: "#b6d4f6",
    },
    detailBoxCompletion: {
        backgroundColor: "#edfdf6",
        borderColor: "#9adabf",
    },
    detailBoxHours: {
        backgroundColor: "#fff8ea",
        borderColor: "#efd49a",
    },
    detailLabel: {
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: 0.7,
        color: "#60758f",
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16.5,
        color: "#0b1e3a",
        fontFamily: "Helvetica-Bold",
    },
    detailNote: {
        marginTop: 2,
        fontSize: 10,
        color: "#314867",
    },
    skillsSection: {
        marginTop: 10,
    },
    skillsTitle: {
        fontSize: 11.5,
        color: "#2f4563",
        textTransform: "uppercase",
        letterSpacing: 0.7,
        marginBottom: 5,
        fontFamily: "Helvetica-Bold",
    },
    skillsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    skillChip: {
        border: "1pt solid #b7d5f8",
        backgroundColor: "#eaf4ff",
        paddingVertical: 3,
        paddingHorizontal: 8,
        marginRight: 6,
        marginBottom: 6,
        fontSize: 9,
        color: "#1e3a8a",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    footer: {
        marginTop: 10,
        paddingTop: 8,
        borderTop: "1pt solid #bfd0e3",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    footerMeta: {
        flexDirection: "column",
    },
    footerLabel: {
        fontSize: 9,
        color: "#60758f",
        textTransform: "uppercase",
        letterSpacing: 0.7,
    },
    footerValue: {
        fontSize: 11,
        color: "#0b1e3a",
        fontFamily: "Helvetica-Bold",
        marginBottom: 4,
    },
    signatureBlock: {
        alignItems: "center",
    },
    signatureLine: {
        width: 170,
        borderBottom: "1pt solid #0b1e3a",
        marginBottom: 6,
    },
    signatureName: {
        fontSize: 12,
        color: "#0b1e3a",
        fontFamily: "Helvetica-Bold",
    },
    signatureRole: {
        fontSize: 9,
        color: "#60758f",
        textTransform: "uppercase",
        letterSpacing: 0.7,
    },
    sealWrap: {
        position: "absolute",
        right: 40,
        top: 94,
        width: 72,
        height: 72,
        borderRadius: 36,
        border: "2pt solid #d6a54a",
        backgroundColor: "#fff7df",
        justifyContent: "center",
        alignItems: "center",
    },
    sealText: {
        fontSize: 7.4,
        color: "#8a6324",
        textAlign: "center",
        fontFamily: "Helvetica-Bold",
        textTransform: "uppercase",
        lineHeight: 1.2,
    },
});

interface CertificateProps {
    studentName: string;
    courseName: string;
    issueDate: string;
    verificationId: string;
    grade: string;
    completionPercentage: number;
    totalLearningHours: number;
    skills: string[];
}

export const CertificateDocument: React.FC<CertificateProps> = ({
    studentName,
    courseName,
    issueDate,
    verificationId,
    grade,
    completionPercentage,
    totalLearningHours,
    skills,
}) => (
    <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
            <View style={styles.frameOuter}>
                <View style={styles.frameInner}>
                    <View style={styles.topAccentBar}></View>
                    <View style={styles.topAccentGold}></View>
                    <View style={styles.sideAccentLeft}></View>
                    <View style={styles.sideAccentRight}></View>

                    <View style={styles.topRow}>
                        <View style={styles.leftBrand}>
                            <Text style={styles.orgLabel}>Autonomous Learning Certificate</Text>
                            <Text style={styles.orgName}>CAMPUS AI LABS</Text>
                        </View>
                        <Text style={styles.verifiedBadge}>Verified Certificate</Text>
                    </View>

                    <View style={styles.sealWrap}>
                        <Text style={styles.sealText}>Premium{"\n"}Academic{"\n"}Record</Text>
                    </View>

                    <View style={styles.bodyWrap}>
                        <View style={styles.titleBlock}>
                            <Text style={styles.certificateTitle}>Certificate of Completion</Text>
                            <Text style={styles.certificateSubTitle}>Academic Excellence Record</Text>
                        </View>

                        <View style={styles.middleSection}>
                            <Text style={styles.certifyText}>This is to certify that</Text>
                            <Text style={styles.learnerName}>{studentName}</Text>
                            <Text style={styles.completedText}>has successfully completed the autonomous course</Text>

                            <View style={styles.courseWrap}>
                                <Text style={styles.courseName}>{courseName}</Text>
                            </View>

                            <Text style={styles.achievementText}>
                                Recognized for disciplined completion of AI-curated modules, topic mastery,
                                consistent revision practice, and measurable learning progression.
                            </Text>
                            <View style={styles.dividerOrnament}>
                                <View style={styles.dividerLine}></View>
                                <View style={styles.dividerDot}></View>
                            </View>
                        </View>

                        <View>
                            <View style={styles.detailsGrid}>
                                <View style={[styles.detailBox, styles.detailBoxGrade]}>
                                    <Text style={styles.detailLabel}>Final Grade</Text>
                                    <Text style={styles.detailValue}>{grade}</Text>
                                    <Text style={styles.detailNote}>Based on completion consistency</Text>
                                </View>
                                <View style={[styles.detailBox, styles.detailBoxCompletion]}>
                                    <Text style={styles.detailLabel}>Completion</Text>
                                    <Text style={styles.detailValue}>{completionPercentage}%</Text>
                                    <Text style={styles.detailNote}>All required topics completed</Text>
                                </View>
                                <View style={[styles.detailBox, styles.detailBoxHours]}>
                                    <Text style={styles.detailLabel}>Learning Hours</Text>
                                    <Text style={styles.detailValue}>{totalLearningHours} hrs</Text>
                                    <Text style={styles.detailNote}>Estimated guided study time</Text>
                                </View>
                            </View>

                            <View style={styles.skillsSection}>
                                <Text style={styles.skillsTitle}>Skills Acquired</Text>
                                <View style={styles.skillsRow}>
                                    {skills.slice(0, 5).map((skill, index) => (
                                        <Text key={`${skill}-${index}`} style={styles.skillChip}>{skill}</Text>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.footerMeta}>
                            <Text style={styles.footerLabel}>Issue Date</Text>
                            <Text style={styles.footerValue}>{issueDate}</Text>
                            <Text style={styles.footerLabel}>Verification ID</Text>
                            <Text style={styles.footerValue}>{verificationId}</Text>
                        </View>

                        <View style={styles.signatureBlock}>
                            <View style={styles.signatureLine}></View>
                            <Text style={styles.signatureName}>CAMPUS AI ENGINE</Text>
                            <Text style={styles.signatureRole}>Authorized Digital Signatory</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Page>
    </Document>
);
