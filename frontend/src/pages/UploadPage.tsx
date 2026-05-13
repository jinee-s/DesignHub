import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI, designsAPI } from '../api';
import { Button, Input, Loading, Textarea } from '../components/ui';
import type { CreateDesignData } from '../api';

export function UploadPage() {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'details'>('upload');

  // Category mapping - matches backend enum values
  const CATEGORIES = {
    'ui-ux': 'UI/UX',
    'web': 'Web Design',
    'mobile': 'Mobile Design',
    'graphic': 'Graphic Design',
    'illustration': 'Illustration',
    'other': 'Other'
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'ui-ux',
    tags: '',
  });

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit (matches backend)
      setError('Image must be less than 5MB');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStep('details');
    setError('');
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsUploading(true);
    // Frontend validation
    const errors: Record<string, string> = {};
    if (!imageFile) errors.image = 'Please select an image file';
    if (!formData.title || formData.title.trim().length < 3) errors.title = 'Title is required (3+ characters)';
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      setIsUploading(false);
      return;
    }

    try {
      if (!imageFile) {
        throw new Error('Image is required');
      }

      // Step 1: Upload image to Cloudinary
      // Upload the selected file (uploadAPI.image expects a File)
      const uploadResponse = await uploadAPI.image(imageFile, (p) => setUploadProgress(p));
      
      // Check if upload was successful
      if (!uploadResponse?.success || !uploadResponse?.data?.imageUrl) {
        console.error('Upload response:', uploadResponse);
        throw new Error('Image upload failed - invalid response format');
      }

      const { imageUrl, thumbnailUrl, cloudinaryId } = uploadResponse.data;

      // Step 2: Create design post in database
      const designData: CreateDesignData = {
        title: formData.title,
        description: formData.description,
        imageUrl,
        thumbnailUrl,
        cloudinaryId,
        category: CATEGORIES[formData.category as keyof typeof CATEGORIES],
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };

      const designResponse = await designsAPI.create(designData);

      // Redirect to design detail page
      navigate(`/design/${designResponse.data._id}`);
    } catch (err) {
      // Better error handling
      let errorMessage = 'Failed to upload design. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = (err as any).message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      // Keep validationErrors as-is; user can correct and retry
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-6xl md:text-7xl font-bold text-gray-950 mb-6 tracking-tight\">Share your design</h1>
          <p className="text-xl text-gray-600 max-w-xl leading-relaxed font-light\">Upload your creative work and get feedback from our community</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg animate-in">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Image Upload */}
        {step === 'upload' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-950 mb-3">Choose your image</h2>
                <p className="text-gray-600 text-lg">PNG, JPG, GIF, WebP up to 5MB</p>
              </div>

              <label className="block group cursor-pointer">
                <div className="flex flex-col items-center justify-center gap-5 p-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gradient-to-br from-white to-gray-50 group-hover:from-gray-50 group-hover:to-gray-100 group-hover:border-pink-400 transition-all duration-200">
                  <div className="p-5 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl group-hover:from-pink-100 group-hover:to-rose-100 transition-colors duration-200">
                    <svg className="w-10 h-10 text-pink-600 group-hover:text-rose-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-950 text-lg">Click to upload or drag and drop</p>
                    <p className="text-gray-500 mt-2 text-sm">SVG, PNG, JPG, GIF or WebP (max. 5MB)</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  aria-label="Upload design image"
                />
              </label>

              {validationErrors.image && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">{validationErrors.image}</p>
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-950 text-lg">Preview</h3>
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors"
                    >
                      Change image
                    </button>
                  </div>
                  <div className="relative aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button 
                    fullWidth 
                    variant="primary"
                    onClick={() => setStep('details')}
                  >
                    Continue to Details
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Design Details */}
        {step === 'details' && (
          <div className="card p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Design Title */}
              <Input
                label="Design title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Mobile App Redesign"
                required
                error={validationErrors.title}
              />

              {/* Description */}
              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell us about your design, process, and inspiration..."
                rows={5}
                error={validationErrors.description}
              />

              {/* Category & Tags Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-gray-950 uppercase tracking-wide mb-3">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input w-full"
                  >
                    <option value="ui-ux">UI/UX</option>
                    <option value="web">Web Design</option>
                    <option value="mobile">Mobile Design</option>
                    <option value="graphic">Graphic Design</option>
                    <option value="illustration">Illustration</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <Input
                  label="Tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="design, ui, web (comma-separated)"
                  error={validationErrors.tags}
                />
              </div>

              {/* Image Preview in Details Step */}
              <div>
                <h3 className="font-bold text-gray-950 text-lg mb-4">Preview</h3>
                <div className="aspect-video rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                  <img
                    src={imagePreview}
                    alt="Design preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Uploading to Cloudinary...</span>
                    <span className="text-sm font-bold text-pink-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-rose-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                    setStep('upload');
                    setFormData({ title: '', description: '', category: 'ui-ux', tags: '' });
                  }}
                  disabled={isUploading}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-950 font-semibold hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Back
                </button>
                <Button
                  type="submit"
                  fullWidth
                  isLoading={isUploading}
                  disabled={!formData.title || isUploading}
                >
                  {isUploading ? 'Publishing...' : 'Publish Design'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
