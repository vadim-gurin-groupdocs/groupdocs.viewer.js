using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

namespace Groupdocs.Web.UI
{
    /// <summary>
    /// Position of a watermark on a document page
    /// </summary>
    public enum WatermarkPosition
    {
        Diagonal, TopLeft, TopCenter, TopRight, BottomLeft, BottomCenter, BottomRight
    }

    public interface IWatermarkCreator
    {
        byte[] GetWatermarkedImage(byte[] imageBytes, string watermarkText, bool fullWidth = true,
                                   int? watermarkColor = null, 
                                   WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                   float watermarkWidth = 0);
        byte[] GetWatermarkedImage(string imagePath, string watermarkText, bool fullWidth = true,
                                   int? watermarkColor = null,
                                   WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                   float watermarkWidth = 0);
        byte[] GetWatermarkedImage(Stream imageStream, string watermarkText, bool fullWidth = true,
                                   int? watermarkColor = null,
                                   WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                   float watermarkWidth = 0);
        
        Stream GetImageFromText(int width, string trialText);
    }


    public class WatermarkCreator : IWatermarkCreator
    {
        public byte[] GetWatermarkedImage(byte[] imageBytes, string watermarkText, bool fullWidth = true,
                                          int? watermarkColor = null,
                                          WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                          float watermarkWidth = 0)
        {
            using (MemoryStream imageStream = new MemoryStream(imageBytes))
            {
                return GetWatermarkedImage(imageStream, watermarkText, fullWidth, watermarkColor, watermarkPosition, watermarkWidth);
            }
        }

        public byte[] GetWatermarkedImage(string imagePath, string watermarkText, bool fullWidth = true,
                                          int? watermarkColor = null,
                                          WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                          float watermarkWidth = 0)
        {
            using (Stream imageStream = File.OpenRead(imagePath))
            {
                return GetWatermarkedImage(imageStream, watermarkText, fullWidth, watermarkColor, watermarkPosition, watermarkWidth);
            }
        }

        public byte[] GetWatermarkedImage(Stream imageStream, string watermarkText, bool fullWidth = true,
                                          int? watermarkColor = null,
                                          WatermarkPosition watermarkPosition = WatermarkPosition.Diagonal,
                                          float watermarkWidth = 0)
        {
            byte[] watermarkedImage;
            Font font = null;
            Brush foregroundBrush = null;
            Brush backgroundBrush = null;
            bool deleteForegroundBrush = false;
            float watermarkWidthInPercents = watermarkWidth;
            try
            {
                using (System.Drawing.Image image = System.Drawing.Image.FromStream(imageStream))
                {
                    using (Graphics gr = Graphics.FromImage(image))
                    {
                        StringFormat stringFormat = StringFormat.GenericTypographic;
                        stringFormat.FormatFlags |= StringFormatFlags.MeasureTrailingSpaces;

                        int imageWidth = image.Width, imageHeight = image.Height;
                        SizeF stringSize;
                        int stringWidth;
                        int left = 0;
                        int top = 60;
                        float resultWidth, resultHeight;

                        FontFamily fontFamily = SystemFonts.DefaultFont.FontFamily;
                        stringFormat.Alignment = StringAlignment.Near;
                        int maxTextWidth;
                        if (watermarkPosition == WatermarkPosition.Diagonal)
                            maxTextWidth = Math.Min(imageWidth, imageHeight);
                        else
                            maxTextWidth = imageWidth;
                        if (watermarkWidthInPercents != 0)
                            maxTextWidth = (int)(maxTextWidth * watermarkWidthInPercents / 100);
                        bool fits = true;
                        const float sizeStep = 0.1f, minSize = 0.1f;
                        SizeF newStringSize;
                        float size = minSize;
                        do
                        {
                            using (font = new Font(fontFamily, size, FontStyle.Bold, GraphicsUnit.Pixel))
                            {
                                newStringSize = gr.MeasureString(watermarkText, font);
                            }
                            font = null;
                            fits = newStringSize.Width < maxTextWidth;
                            size += sizeStep;
                        } while (fits);
                        size -= sizeStep;
                        if (size < minSize)
                            size = minSize;

                        font = new Font(fontFamily, size, FontStyle.Bold, GraphicsUnit.Pixel);
                        stringSize = gr.MeasureString(watermarkText, font);
                        stringWidth = (int) stringSize.Width;
                        resultWidth = stringWidth;
                        left = (int) (-stringWidth/2);
                        top = (int) (-stringSize.Height/2);

                        Color watermarkColorDecoded;
                        const int alpha = 255;
                        backgroundBrush = new SolidBrush(Color.FromArgb(alpha, 255, 255, 255));
                        if (watermarkColor == null)
                        {
                            backgroundBrush = new SolidBrush(Color.FromArgb(alpha, 255, 255, 255));
                            foregroundBrush = Brushes.Red;
                        }
                        else
                        {
                            backgroundBrush = new SolidBrush(Color.Transparent);
                            watermarkColorDecoded = Color.FromArgb((int) watermarkColor);
                            deleteForegroundBrush = true;
                            foregroundBrush = new SolidBrush(watermarkColorDecoded);
                        }
                        resultHeight = stringSize.Height + 1;
                        
                        if (watermarkPosition == WatermarkPosition.Diagonal)
                        {
                            gr.TranslateTransform(imageWidth/2, imageHeight/2);
                            gr.RotateTransform(-50);
                        }
                        else
                        {
                            if (watermarkPosition == WatermarkPosition.TopLeft
                                || watermarkPosition == WatermarkPosition.TopCenter
                                || watermarkPosition == WatermarkPosition.TopRight)
                            {
                                top = 0;
                            }
                            else
                            {
                                top = imageHeight - (int) resultHeight;
                            }

                            if (watermarkPosition == WatermarkPosition.TopLeft
                                || watermarkPosition == WatermarkPosition.BottomLeft)
                            {
                                left = 0;
                            }
                            else if (watermarkPosition == WatermarkPosition.TopCenter
                                     || watermarkPosition == WatermarkPosition.BottomCenter)
                            {
                                left = imageWidth/2 - stringWidth/2;
                            }
                            else if (watermarkPosition == WatermarkPosition.TopRight
                                     || watermarkPosition == WatermarkPosition.BottomRight)
                            {
                                left = imageWidth - stringWidth;
                            }

                        }
                        gr.FillRectangle(backgroundBrush, new RectangleF(left, top, resultWidth, resultHeight));
                        gr.DrawString(watermarkText, font, foregroundBrush,
                                      new RectangleF(left, top, resultWidth, resultHeight), stringFormat);
                    }
                    using (MemoryStream memoryStream = new MemoryStream())
                    {
                        image.Save(memoryStream, ImageFormat.Jpeg);
                        watermarkedImage = memoryStream.ToArray();
                    }
                }
            }
            finally
            {
                if (font != null)
                    font.Dispose();
                if (foregroundBrush != null && deleteForegroundBrush)
                    foregroundBrush.Dispose();
                if (backgroundBrush != null)
                    backgroundBrush.Dispose();
            }
            return watermarkedImage;
        }
        

        public Stream GetImageFromText(int width, string trialText)
        {
            MemoryStream memoryStream;
            using (Bitmap image = new Bitmap(width, width/3*4))
            {
                using (Graphics gr = Graphics.FromImage(image))
                {
                    gr.Clear(Color.White);

                    StringFormat stringFormat = new StringFormat();
                    stringFormat.Alignment = StringAlignment.Center;

                    Font font = SystemFonts.DefaultFont;
                    SizeF stringSize = gr.MeasureString(trialText, font, image.Width, stringFormat);
                    int left = 0, top = 60;
                    Brush foregroundBrush = Brushes.Red;
                    Brush backgroundBrush = Brushes.White;
                    {
                        gr.FillRectangle(backgroundBrush, left, top, image.Width, (int)stringSize.Height);

                        gr.DrawString(trialText, font, foregroundBrush,
                                      new RectangleF(left, top, image.Width, stringSize.Height), stringFormat);
                    }
                }
                memoryStream = new MemoryStream();
                image.Save(memoryStream, ImageFormat.Jpeg);
            }
            memoryStream.Position = 0;
            return memoryStream;
        }
    }
}
