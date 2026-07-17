import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import json
import argparse
import os
import sys
import time
import re
from collections import Counter
from urllib.parse import urljoin, urlparse


class BrutalistReportScraper:
    """
    Enhanced scraper for brutalist.report with support for:
    - Today or last week scraping
    - Topic filtering
    - Progress tracking
    - Grouped results by similarity
    - Sorting by group size
    """

    AVAILABLE_TOPICS = [
        "tech",
        "news",
        "business",
        "science",
        "gaming",
        "culture",
        "politics",
        "sports",
    ]

    def __init__(self):
        self.base_url = "https://brutalist.report"
        self.progress_bar = None
        # Adjusted similarity thresholds to be more balanced between topic and general
        self.similarity_thresholds = {
            "topic": 4,  # Topic-specific content needs 4 common words
            "general": 4,  # General content also needs 4 common words
            "topic_last_week": 5,  # Topic content from last week needs 5 common words
            "general_last_week": 6,  # General content from last week needs 6 common words
        }
        # Minimum number of articles required to form a group
        self.min_group_size = 5

    def create_url(self, topic=None, before_date=None):
        """Constructs URL based on topic and date parameters"""
        url = self.base_url

        # Add topic path if provided
        if topic and topic in self.AVAILABLE_TOPICS:
            url += f"/topic/{topic}"

        # Add before parameter if provided
        if before_date:
            url += f"?before={before_date}"

        return url

    def scrape_page(self, url):
        """Scrapes a single brutalist.report page"""
        self.update_progress("Fetching URL: " + url)
        try:
            response = requests.get(url)
            response.raise_for_status()
        except requests.RequestException as e:
            self.update_progress(f"Error fetching {url}: {e}")
            return None

        # Parse the HTML
        soup = BeautifulSoup(response.text, "html.parser")

        # Find the brutal-grid div that contains news sections
        brutal_grid = soup.find("div", class_="brutal-grid")
        if not brutal_grid:
            self.update_progress(f"No news grid found on {url}")
            return None

        # Dictionary to store results
        news_data = {"url": url, "sources": {}}

        # Process each news source div within the grid
        for div in brutal_grid.find_all("div", recursive=False):
            # Get the source name from the h3 tag
            h3 = div.find("h3")
            if not h3 or not h3.find("a"):
                continue

            source_name = h3.find("a").text.strip()

            # Get all headlines in this source's list
            headlines = []
            ul = div.find("ul")
            if not ul:
                continue

            for li in ul.find_all("li"):
                # Get the main headline link
                headline_link = li.find("a")
                if not headline_link:
                    continue

                headline_url = headline_link.get("href", "")
                headline_text = headline_link.text.strip()

                # Get time if available (in the format [1h])
                time_text = None
                for text in li.stripped_strings:
                    if "[" in text and "]" in text and "h]" in text:
                        time_text = text.strip()
                        break

                # Get the source-specific link (like [hn])
                source_specific_link = None
                links = li.find_all("a")
                if len(links) > 1:
                    last_link = links[-1]
                    if last_link.text.strip().startswith(
                        "["
                    ) and last_link.text.strip().endswith("]"):
                        source_specific_link = {
                            "text": last_link.text.strip(),
                            "url": last_link.get("href", ""),
                        }

                headlines.append(
                    {
                        "title": headline_text,
                        "url": headline_url,
                        "time": time_text,
                        "source_link": source_specific_link,
                    }
                )

            # Add this source to our news data
            if headlines:
                news_data["sources"][source_name] = headlines

        return news_data

    def scrape_today(self, topic=None):
        """Scrapes today's headlines, optionally filtered by topic"""
        url = self.create_url(topic)
        self.update_progress(
            json.dumps(
                {
                    "status": "progress",
                    "message": f"Scraping today's content{f' for {topic}' if topic else ''}...",
                    "processed": 0,
                    "total": 0,
                }
            )
        )
        return self.scrape_page(url)

    def scrape_last_week(self, topic=None):
        """Scrapes headlines from the past week, optionally filtered by topic"""
        # Generate dates for the past week
        current_date = datetime.now().date()
        dates = []
        for i in range(2, 9):  # 2 to 8 inclusive (7 days)
            date = current_date - timedelta(days=i)
            dates.append(date.strftime("%Y-%m-%d"))

        # Scrape data for each date
        aggregated_data = {
            "date_range": f"{dates[-1]} to {dates[0]}",  # Oldest to newest
            "sources": {},
        }

        self.update_progress(
            json.dumps(
                {
                    "status": "progress",
                    "message": f"Scraping past week ({aggregated_data['date_range']}){f' for {topic}' if topic else ''}...",
                    "processed": 0,
                    "total": len(dates),
                }
            )
        )

        for i, before_date in enumerate(dates, 1):
            url = self.create_url(topic, before_date)
            news_data = self.scrape_page(url)

            if news_data and news_data.get("sources"):
                for source, headlines in news_data["sources"].items():
                    if source not in aggregated_data["sources"]:
                        aggregated_data["sources"][source] = []
                    aggregated_data["sources"][source].extend(headlines)

            # Update progress
            self.update_progress(
                json.dumps(
                    {
                        "status": "progress",
                        "message": f"Processing date {before_date}...",
                        "processed": i,
                        "total": len(dates),
                    }
                )
            )

        return aggregated_data

    # =====================================================================
    # EXPERIMENTAL FEATURE: Article Image Extraction
    # Improved version with better efficiency and reliability
    # =====================================================================
    def extract_article_image(self, article_url, max_retries=2):
        """
        Extract the main image from a news article.
        Improved version with better meta tag handling and faster processing.
        """
        for attempt in range(max_retries):
            try:
                # Better headers - more compatible with news sites
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
                
                response = requests.get(article_url, headers=headers, timeout=10, allow_redirects=True)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Strategy 1: Meta tags (most reliable)
                image_result = self._extract_from_meta_tags(soup, article_url)
                if image_result:
                    return image_result
                
                # Strategy 2: JSON-LD structured data
                image_result = self._extract_from_json_ld(soup, article_url)
                if image_result:
                    return image_result
                
                # Strategy 3: Common news site patterns
                image_result = self._extract_from_common_patterns(soup, article_url)
                if image_result:
                    return image_result
                
                # Strategy 4: Intelligent image analysis
                image_result = self._extract_from_content_analysis(soup, article_url)
                if image_result:
                    return image_result
                
                return None
                
            except requests.Timeout:
                if attempt < max_retries - 1:
                    continue
                return {
                    'error': 'Request timeout',
                    'error_type': 'Timeout',
                    'source_url': article_url
                }
            except requests.RequestException as e:
                return {
                    'error': str(e),
                    'error_type': type(e).__name__,
                    'source_url': article_url
                }
            except Exception as e:
                return {
                    'error': str(e),
                    'error_type': 'UnexpectedError',
                    'source_url': article_url
                }
        
        return None
    
    def _extract_from_meta_tags(self, soup, article_url):
        """Extract image from various meta tag formats."""
        # Priority order of meta tags to check
        meta_checks = [
            # Open Graph
            {'property': 'og:image'},
            {'property': 'og:image:url'},
            {'property': 'og:image:secure_url'},
            # Twitter Card
            {'name': 'twitter:image'},
            {'property': 'twitter:image'},
            {'name': 'twitter:image:src'},
            # Other common formats
            {'name': 'image'},
            {'itemprop': 'image'},
            {'name': 'thumbnail'},
        ]
        
        for check in meta_checks:
            tag = soup.find('meta', attrs=check)
            if tag and tag.get('content'):
                img_url = tag['content'].strip()
                
                if self._is_valid_image_url(img_url):
                    # Get alt text from title tags
                    alt_text = self._get_alt_text_from_meta(soup)
                    
                    return {
                        'url': urljoin(article_url, img_url),
                        'alt': alt_text,
                        'source_url': article_url
                    }
        
        return None
    
    def _get_alt_text_from_meta(self, soup):
        """Get descriptive alt text from meta tags."""
        # Try multiple meta tag sources for alt text
        alt_sources = [
            soup.find('meta', property='og:title'),
            soup.find('meta', property='og:description'),
            soup.find('meta', attrs={'name': 'twitter:title'}),
            soup.find('meta', attrs={'name': 'description'}),
            soup.find('title')
        ]
        
        for source in alt_sources:
            if source:
                content = source.get('content') if hasattr(source, 'get') else source.string
                if content:
                    return content.strip()[:150]
        
        return 'Article image'
    
    def _extract_from_json_ld(self, soup, article_url):
        """Extract image from JSON-LD structured data."""
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        
        for script in json_ld_scripts:
            try:
                if not script.string:
                    continue
                
                data = json.loads(script.string)
                
                # Handle both single objects and arrays
                items = [data] if isinstance(data, dict) else data if isinstance(data, list) else []
                
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    
                    # Look for image in various JSON-LD structures
                    image_url = self._extract_image_from_json_object(item)
                    
                    if image_url and self._is_valid_image_url(image_url):
                        alt_text = item.get('headline') or item.get('name') or item.get('title') or 'Article image'
                        
                        return {
                            'url': urljoin(article_url, image_url),
                            'alt': str(alt_text)[:150],
                            'source_url': article_url
                        }
                        
            except (json.JSONDecodeError, TypeError, AttributeError):
                continue
        
        return None
    
    def _extract_image_from_json_object(self, obj):
        """Recursively extract image URL from JSON object."""
        if not isinstance(obj, dict):
            return None
        
        # Direct image field
        if 'image' in obj:
            img = obj['image']
            
            # String URL
            if isinstance(img, str):
                return img
            
            # Object with url field
            if isinstance(img, dict):
                if 'url' in img:
                    return img['url']
                if 'contentUrl' in img:
                    return img['contentUrl']
            
            # Array of images
            if isinstance(img, list) and len(img) > 0:
                first_img = img[0]
                if isinstance(first_img, str):
                    return first_img
                if isinstance(first_img, dict):
                    return first_img.get('url') or first_img.get('contentUrl')
        
        # Check other common fields
        for field in ['thumbnailUrl', 'contentUrl', 'url']:
            if field in obj and isinstance(obj[field], str):
                potential_url = obj[field]
                if any(ext in potential_url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif']):
                    return potential_url
        
        return None
    
    def _extract_from_common_patterns(self, soup, article_url):
        """Extract image using common news site patterns."""
        # Priority selectors for news sites
        selectors = [
            # Article images
            'article img[src]',
            '[class*="article"] img[src]',
            '[class*="story"] img[src]',
            '[class*="post"] img[src]',
            # Hero/featured images
            '[class*="hero"] img[src]',
            '[class*="featured"] img[src]',
            '[class*="lead"] img[src]',
            '[class*="main"] img[src]',
            # Figure elements
            'figure img[src]',
            'picture img[src]',
            # Content areas
            '[class*="content"] img[src]',
            '[id*="content"] img[src]',
        ]
        
        for selector in selectors:
            imgs = soup.select(selector)
            
            for img in imgs[:5]:  # Check first 5 matches
                src = self._get_image_src(img)
                
                if not src or not self._is_valid_image_url(src):
                    continue
                
                # Get alt text
                alt = img.get('alt', '').strip()
                
                # Validate image quality
                if self._is_content_image(src, alt, img):
                    # Try to get better alt text from parent elements
                    if not alt or len(alt) < 5:
                        alt = self._get_context_alt_text(img, soup)
                    
                    return {
                        'url': urljoin(article_url, src),
                        'alt': alt[:150] if alt else 'Article image',
                        'source_url': article_url
                    }
        
        return None
    
    def _extract_from_content_analysis(self, soup, article_url):
        """Analyze page content to find the best image."""
        # Find main content area
        content_areas = soup.find_all(['article', 'main', '[role="main"]'])
        
        if not content_areas:
            # Fallback to common content class names
            content_areas = soup.find_all(class_=re.compile(r'(content|article|post|story|entry)', re.I))
        
        candidate_images = []
        
        for area in content_areas[:3]:  # Check first 3 content areas
            imgs = area.find_all('img', src=True)
            
            for img in imgs[:10]:  # Check first 10 images in each area
                src = self._get_image_src(img)
                
                if not src or not self._is_valid_image_url(src):
                    continue
                
                alt = img.get('alt', '').strip()
                
                # Score the image
                score = self._score_image(img, src, alt)
                
                if score > 0:
                    candidate_images.append({
                        'img': img,
                        'src': src,
                        'alt': alt,
                        'score': score
                    })
        
        # Return highest scoring image
        if candidate_images:
            best = max(candidate_images, key=lambda x: x['score'])
            
            alt_text = best['alt'] if best['alt'] else self._get_context_alt_text(best['img'], soup)
            
            return {
                'url': urljoin(article_url, best['src']),
                'alt': alt_text[:150] if alt_text else 'Article image',
                'source_url': article_url
            }
        
        return None
    
    def _get_image_src(self, img):
        """Get image source from various attributes."""
        # Try multiple source attributes
        for attr in ['src', 'data-src', 'data-lazy-src', 'data-original', 'data-srcset']:
            src = img.get(attr)
            if src:
                # Handle srcset format
                if ',' in src:
                    src = src.split(',')[0].strip().split()[0]
                return src.strip()
        
        # Check srcset attribute
        srcset = img.get('srcset')
        if srcset:
            # Get the largest image from srcset
            sources = srcset.split(',')
            if sources:
                return sources[-1].strip().split()[0]
        
        return None
    
    def _is_valid_image_url(self, url):
        """Quick validation for image URLs"""
        if not url or len(url) < 10:
            return False
        
        url_lower = url.lower()
        
        # Must be a valid image extension or contain image-like patterns
        valid_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']
        has_valid_extension = any(ext in url_lower for ext in valid_extensions)
        
        # Or contains image-like patterns common in news sites
        image_patterns = ['image', 'photo', 'picture', 'img', 'media', 'upload', 'content', 'asset']
        has_image_pattern = any(pattern in url_lower for pattern in image_patterns)
        
        if not (has_valid_extension or has_image_pattern):
            return False
        
        # Skip obvious non-content images
        skip_patterns = [
            'logo', 'icon', 'avatar', 'profile', 'placeholder',
            'ad', 'banner', 'sponsor', 'promo', 'advertisement',
            '1x1', 'pixel', 'tracking', 'beacon', 'spacer',
            'button', 'badge', 'widget', 'social'
        ]
        
        return not any(pattern in url_lower for pattern in skip_patterns)
    
    def _is_content_image(self, src, alt, img):
        """Determine if image is likely article content."""
        src_lower = src.lower()
        alt_lower = alt.lower() if alt else ''
        
        # Skip tracking and ads
        skip_terms = [
            'pixel', 'tracking', '1x1', 'beacon', 'analytics',
            'ad', 'banner', 'sponsor', 'advertisement',
            'logo', 'icon', 'avatar', 'profile',
            'facebook', 'twitter', 'instagram', 'social',
            'share', 'button', 'widget'
        ]
        
        if any(term in src_lower or term in alt_lower for term in skip_terms):
            return False
        
        # Check image dimensions if available
        width = img.get('width', '')
        height = img.get('height', '')
        
        try:
            if width and height:
                w, h = int(width), int(height)
                # Skip very small images
                if w < 200 or h < 200:
                    return False
                # Skip tiny images (likely icons)
                if w < 50 and h < 50:
                    return False
        except (ValueError, TypeError):
            pass
        
        # Good indicators
        good_patterns = ['article', 'content', 'story', 'post', 'featured', 'hero', 'main']
        has_good_pattern = any(pattern in src_lower for pattern in good_patterns)
        
        # Meaningful alt text is a good sign
        has_good_alt = alt and len(alt.strip()) > 10
        
        return has_good_pattern or has_good_alt
    
    def _score_image(self, img, src, alt):
        """Score an image's likelihood of being the main article image."""
        score = 0
        
        src_lower = src.lower()
        alt_lower = alt.lower() if alt else ''
        
        # Positive indicators
        if any(pattern in src_lower for pattern in ['hero', 'featured', 'main', 'lead']):
            score += 10
        
        if any(pattern in src_lower for pattern in ['article', 'story', 'content', 'post']):
            score += 5
        
        if alt and len(alt) > 20:
            score += 5
        
        if alt and len(alt) > 50:
            score += 3
        
        # Check position in page (earlier is better)
        parent = img.find_parent()
        if parent and parent.name in ['article', 'main']:
            score += 5
        
        # Check for figure/picture elements (common for main images)
        if img.find_parent(['figure', 'picture']):
            score += 3
        
        # Negative indicators
        if any(term in src_lower or term in alt_lower for term in ['logo', 'icon', 'avatar', 'ad', 'banner']):
            score -= 20
        
        if '1x1' in src_lower or 'pixel' in src_lower:
            score -= 20
        
        # Check dimensions
        try:
            width = int(img.get('width', 0))
            height = int(img.get('height', 0))
            
            if width > 400 and height > 300:
                score += 5
            
            if width < 100 or height < 100:
                score -= 10
        except (ValueError, TypeError):
            pass
        
        return score
    
    def _get_context_alt_text(self, img, soup):
        """Get alt text from surrounding context."""
        # Try parent figure caption
        figure = img.find_parent('figure')
        if figure:
            figcaption = figure.find('figcaption')
            if figcaption:
                return figcaption.get_text(strip=True)[:150]
        
        # Try nearby headings
        parent = img.find_parent()
        if parent:
            heading = parent.find(['h1', 'h2', 'h3'])
            if heading:
                return heading.get_text(strip=True)[:150]
        
        # Try article title
        og_title = soup.find('meta', property='og:title')
        if og_title and og_title.get('content'):
            return og_title['content'][:150]
        
        title = soup.find('title')
        if title:
            return title.get_text(strip=True)[:150]
        
        return 'Article image'
    
    def extract_images_from_group(self, similar_headlines, topic_name):
        """
        Improved image extraction with smarter source selection.
        Prioritizes reliable news sources and uses multiple attempts.
        """
        # Tier 1: Major international news sources (most reliable)
        tier1_sources = [
            'Reuters', 'AP News', 'Associated Press', 'BBC', 'CNN', 'NPR', 
            'The Guardian', 'Washington Post', 'New York Times', 'Wall Street Journal'
        ]
        
        # Tier 2: Quality tech and news publications
        tier2_sources = [
            'TechCrunch', 'Ars Technica', 'The Verge', 'Wired', 'Axios',
            'Bloomberg', 'CNBC', 'Financial Times', 'The Atlantic', 'Politico'
        ]
        
        # Group headlines by source
        headlines_by_source = {}
        for headline in similar_headlines:
            source = headline['source']
            if source not in headlines_by_source:
                headlines_by_source[source] = []
            headlines_by_source[source].append(headline)
        
        # Build prioritized source list
        sources_to_try = []
        
        # Add tier 1 sources first
        for priority_source in tier1_sources:
            for source in headlines_by_source:
                if priority_source.lower() in source.lower() and source not in sources_to_try:
                    sources_to_try.append(source)
        
        # Add tier 2 sources
        for priority_source in tier2_sources:
            for source in headlines_by_source:
                if priority_source.lower() in source.lower() and source not in sources_to_try:
                    sources_to_try.append(source)
        
        # Add remaining sources (shuffled for variety)
        remaining_sources = [s for s in headlines_by_source if s not in sources_to_try]
        import random
        random.shuffle(remaining_sources)
        sources_to_try.extend(remaining_sources)
        
        attempted_sources = []
        errors = []
        
        # Try up to 4 sources for better success rate
        for source in sources_to_try[:4]:
            # Pick the first headline from this source (usually the most important)
            headline = headlines_by_source[source][0]
            attempted_sources.append(source)
            
            self.update_progress(json.dumps({
                "status": "progress",
                "message": f"Extracting image from {source} for: {topic_name[:40]}...",
            }))
            
            result = self.extract_article_image(headline["url"])
            
            if result and 'url' in result:
                result['attempted_sources'] = attempted_sources
                return result
            elif result and 'error' in result:
                errors.append({
                    'source': source,
                    'url': headline["url"],
                    'error': result['error'],
                    'error_type': result['error_type']
                })
        
        # All attempts failed
        return {
            'error': 'Failed to extract image from all attempted sources',
            'error_type': 'ExtractionFailure',
            'attempted_sources': attempted_sources,
            'detailed_errors': errors,
            'total_attempts': len(attempted_sources)
        }
    # =====================================================================
    # END OF EXPERIMENTAL FEATURE
    # =====================================================================

    def _normalize_text(self, text):
        """Normalize text for better comparison"""
        # Convert to lowercase
        text = text.lower()
        # Remove punctuation and extra spaces
        text = re.sub(r"[^\w\s]", " ", text)
        # Remove extra whitespace
        text = " ".join(text.split())
        return text

    def _extract_key_phrases(self, text):
        """Extract meaningful phrases and entities from text"""
        normalized = self._normalize_text(text)
        words = normalized.split()

        # Get single important words
        important_words = []
        # Get 2-word phrases
        phrases = []

        stop_words = {
            "a",
            "an",
            "the",
            "and",
            "but",
            "or",
            "for",
            "nor",
            "on",
            "at",
            "to",
            "from",
            "by",
            "with",
            "in",
            "of",
            "is",
            "are",
            "was",
            "were",
            "be",
            "been",
            "being",
            "have",
            "has",
            "had",
            "do",
            "does",
            "did",
            "can",
            "could",
            "will",
            "would",
            "shall",
            "should",
            "may",
            "might",
            "must",
            "that",
            "which",
            "who",
            "whom",
            "this",
            "these",
            "those",
            "how",
            "why",
            "when",
            "where",
            "what",
            # custom
            "hn",
            "nyt",
            "know",
            "best",
            "than",
            "just",
            "your",
            "its",
            "hint and answers",
            "you",
        }

        # Extract meaningful single words (longer than 2 chars, not stop words)
        for word in words:
            if len(word) > 2 and word not in stop_words:
                important_words.append(word)

        # Extract 2-word phrases
        for i in range(len(words) - 1):
            if (
                len(words[i]) > 2
                and len(words[i + 1]) > 2
                and words[i] not in stop_words
                and words[i + 1] not in stop_words
            ):
                phrases.append(f"{words[i]} {words[i + 1]}")

        return important_words, phrases

    def _calculate_similarity_score(self, text1, text2):
        """Calculate comprehensive similarity score between two texts with stricter grouping"""
        words1, phrases1 = self._extract_key_phrases(text1)
        words2, phrases2 = self._extract_key_phrases(text2)

        # Require at least one phrase match for high similarity
        phrase_overlap = len(set(phrases1) & set(phrases2))
        if phrase_overlap == 0:
            # If no phrase overlap, require significant word overlap
            word_overlap = len(set(words1) & set(words2))
            if word_overlap < 3:  # Stricter requirement
                return 0
            word_score = word_overlap * 1.5
        else:
            # Phrase matches get high scores
            word_overlap = len(set(words1) & set(words2))
            word_score = word_overlap * 2
            phrase_score = phrase_overlap * 6  # Higher weight for phrases
            word_score += phrase_score

        # Semantic coherence check - penalize if headlines are about different topics
        # Check for conflicting keywords that suggest different topics
        conflicting_pairs = [
            ("election", "sports"),
            ("politics", "gaming"),
            ("business", "weather"),
            ("covid", "entertainment"),
            ("war", "tech"),
            ("climate", "fashion"),
        ]

        text1_lower = text1.lower()
        text2_lower = text2.lower()

        for pair in conflicting_pairs:
            if (pair[0] in text1_lower and pair[1] in text2_lower) or (
                pair[1] in text1_lower and pair[0] in text2_lower
            ):
                word_score *= 0.3  # Heavy penalty for conflicting topics

        # Length penalty to avoid grouping very different length headlines
        len_diff = abs(len(words1) - len(words2))
        length_penalty = min(len_diff * 0.5, 2)  # Reduced penalty

        total_score = word_score - length_penalty
        return max(0, total_score)

    def find_common_headlines(self, news_data, is_topic=False, is_last_week=False):
        """Identifies headlines common across different sources with improved grouping"""
        if not news_data or "sources" not in news_data:
            return []

        # Set similarity threshold based on context - higher thresholds for stricter grouping
        if is_topic and is_last_week:
            similarity_threshold = 12  # Increased
        elif is_topic:
            similarity_threshold = 9  # Increased
        elif is_last_week:
            similarity_threshold = 14  # Increased
        else:
            similarity_threshold = 10  # Increased

        # Flatten all headlines
        all_headlines = []
        for source, headlines in news_data["sources"].items():
            for headline in headlines:
                all_headlines.append(
                    {
                        "source": source,
                        "title": headline["title"],
                        "url": headline["url"],
                        "time": headline.get("time"),
                        "source_link": headline.get("source_link"),
                    }
                )

        total_headlines = len(all_headlines)
        self.update_progress(
            json.dumps(
                {
                    "status": "progress",
                    "message": "Starting headline analysis...",
                    "processed": 0,
                    "total": total_headlines,
                }
            )
        )

        common_topics = []
        processed_headlines = set()

        # Compare headlines with improved similarity scoring
        for i, headline1 in enumerate(all_headlines, 1):
            if headline1["title"] in processed_headlines:
                self.update_progress(
                    json.dumps(
                        {
                            "status": "progress",
                            "message": "Analyzing headlines...",
                            "processed": i,
                            "total": total_headlines,
                        }
                    )
                )
                continue

            similar_headlines = []

            for headline2 in all_headlines:
                if headline1["title"] == headline2["title"]:
                    continue

                if headline2["title"] in processed_headlines:
                    continue

                # Calculate similarity score
                similarity_score = self._calculate_similarity_score(
                    headline1["title"], headline2["title"]
                )

                if similarity_score >= similarity_threshold:
                    if not similar_headlines:
                        similar_headlines.append(
                            {
                                "source": headline1["source"],
                                "title": headline1["title"],
                                "url": headline1["url"],
                                "time": headline1.get("time"),
                                "source_link": headline1.get("source_link"),
                            }
                        )

                    similar_headlines.append(
                        {
                            "source": headline2["source"],
                            "title": headline2["title"],
                            "url": headline2["url"],
                            "time": headline2.get("time"),
                            "source_link": headline2.get("source_link"),
                        }
                    )

            # Process similar headlines with stricter requirements
            if similar_headlines and len(similar_headlines) >= self.min_group_size:
                sources = {h["source"] for h in similar_headlines}
                # Require at least 3 different sources for better validation
                if len(sources) >= 3:
                    topic_name = self.generate_topic_name(similar_headlines)

                    # Skip if topic name is too generic or too short
                    if len(topic_name.split()) >= 2 and not self._is_generic_topic(
                        topic_name
                    ):
                        topic_data = {
                            "id": len(common_topics) + 1,
                            "topic_name": topic_name,
                            "count": len(similar_headlines),
                            "sources_count": len(sources),
                            "headlines": similar_headlines,
                        }

                        # =====================================================================
                        # EXPERIMENTAL FEATURE: Extract image from multiple articles in the group
                        # If you want to remove this feature, delete this code block
                        # =====================================================================
                        try:
                            image_result = self.extract_images_from_group(
                                similar_headlines, topic_name
                            )
                            # Always add image data, whether successful or failed
                            topic_data["image"] = image_result
                        except Exception as e:
                            # Fallback error handling
                            topic_data["image"] = {
                                "error": f"Unexpected error during image extraction: {str(e)}",
                                "error_type": "UnexpectedError",
                                "attempted_sources": [],
                                "total_attempts": 0,
                            }
                        # =====================================================================
                        # END OF EXPERIMENTAL FEATURE
                        # =====================================================================

                        common_topics.append(topic_data)

                        for headline in similar_headlines:
                            processed_headlines.add(headline["title"])

            self.update_progress(
                json.dumps(
                    {
                        "status": "progress",
                        "message": "Analyzing headlines...",
                        "processed": i,
                        "total": total_headlines,
                    }
                )
            )

        # Sort by size
        common_topics.sort(key=lambda x: x["count"], reverse=True)

        # Re-assign IDs
        for i, topic in enumerate(common_topics, 1):
            topic["id"] = i

        return common_topics

    def _is_generic_topic(self, topic_name):
        """Check if a topic name is too generic"""
        generic_terms = [
            "new report",
            "latest news",
            "breaking news",
            "recent update",
            "major announcement",
            "important news",
            "big news",
            "top story",
        ]
        topic_lower = topic_name.lower()
        return any(generic in topic_lower for generic in generic_terms)

    def generate_topic_name(self, headlines):
        """Enhanced topic name generation with better insight extraction"""
        stop_words = {
            "a",
            "an",
            "the",
            "and",
            "but",
            "or",
            "for",
            "nor",
            "on",
            "at",
            "to",
            "from",
            "by",
            "with",
            "in",
            "of",
            "is",
            "are",
            "was",
            "were",
            "be",
            "been",
            "being",
            "have",
            "has",
            "had",
            "do",
            "does",
            "did",
            "can",
            "could",
            "will",
            "would",
            "shall",
            "should",
            "may",
            "might",
            "must",
            "that",
            "which",
            "who",
            "whom",
            "this",
            "these",
            "those",
            "how",
            "why",
            "when",
            "where",
            "what",
            # custom
            "hn",
            "nyt",
            "know",
            "best",
            "than",
            "just",
            "your",
            "its",
            "hint and answers",
            "you",
        }

        # Extract specific entities and key terms
        all_entities = []
        all_important_phrases = []
        all_keywords = []

        for headline in headlines:
            title = headline["title"]
            normalized = self._normalize_text(title)
            words = normalized.split()

            # Extract entities (capitalized words from original)
            original_words = title.split()
            for word in original_words:
                clean_word = re.sub(r"[^\w]", "", word)
                if (
                    len(clean_word) > 2
                    and word[0].isupper()
                    and clean_word.lower() not in stop_words
                ):
                    all_entities.append(clean_word)

            # Extract meaningful 3-4 word phrases
            for i in range(len(words) - 2):
                if (
                    len(words[i]) > 2
                    and len(words[i + 1]) > 2
                    and len(words[i + 2]) > 2
                    and words[i] not in stop_words
                    and words[i + 1] not in stop_words
                    and words[i + 2] not in stop_words
                ):
                    phrase = f"{words[i]} {words[i + 1]} {words[i + 2]}"
                    all_important_phrases.append(phrase)

                    # Also try 4-word phrases
                    if (
                        i < len(words) - 3
                        and len(words[i + 3]) > 2
                        and words[i + 3] not in stop_words
                    ):
                        phrase4 = f"{phrase} {words[i + 3]}"
                        all_important_phrases.append(phrase4)

            # Extract important keywords (non-stop words)
            for word in words:
                if word not in stop_words and len(word) > 2:
                    all_keywords.append(word)

        # Count frequencies
        entity_counter = Counter(all_entities)
        phrase_counter = Counter(all_important_phrases)
        keyword_counter = Counter(all_keywords)

        # Minimum frequency threshold
        min_freq = max(2, len(headlines) // 4)

        # Try longer phrases first (4+ words) that appear frequently
        long_phrases = [
            (phrase, count)
            for phrase, count in phrase_counter.most_common()
            if count >= min_freq and len(phrase.split()) >= 4
        ]

        if long_phrases:
            return long_phrases[0][0].title()

        # Try 3-word phrases
        medium_phrases = [
            (phrase, count)
            for phrase, count in phrase_counter.most_common()
            if count >= min_freq and len(phrase.split()) == 3
        ]

        if medium_phrases:
            return medium_phrases[0][0].title()

        # Try entity + keyword combinations
        common_entities = [
            (entity, count)
            for entity, count in entity_counter.most_common()
            if count >= min_freq
        ]
        common_keywords = [
            (keyword, count)
            for keyword, count in keyword_counter.most_common()
            if count >= min_freq
        ]

        if common_entities and common_keywords:
            entity = common_entities[0][0]
            # Find a keyword that's not just the entity in lowercase
            for keyword, _ in common_keywords:
                if keyword.lower() != entity.lower():
                    # Try to find context words that appear with this entity
                    context_words = []
                    for headline in headlines:
                        if entity.lower() in headline["title"].lower():
                            words = self._normalize_text(headline["title"]).split()
                            for word in words:
                                if (
                                    word != entity.lower()
                                    and word not in stop_words
                                    and len(word) > 2
                                    and word in [k for k, _ in common_keywords[:5]]
                                ):
                                    context_words.append(word)

                    if context_words:
                        context_counter = Counter(context_words)
                        best_context = context_counter.most_common(1)[0][0]
                        return f"{entity} {best_context.title()}"
                    else:
                        return f"{entity} {keyword.title()}"

        # Try just the most common entity with descriptive context
        if common_entities:
            entity = common_entities[0][0]
            # Look for action words or descriptive terms
            action_words = []
            for headline in headlines:
                if entity.lower() in headline["title"].lower():
                    words = headline["title"].lower().split()
                    for word in words:
                        clean_word = re.sub(r"[^\w]", "", word)
                        if (
                            clean_word not in stop_words
                            and len(clean_word) > 3
                            and clean_word != entity.lower()
                            and any(
                                action in clean_word
                                for action in [
                                    "announce",
                                    "launch",
                                    "report",
                                    "reveal",
                                    "update",
                                    "plan",
                                    "face",
                                    "deal",
                                    "issue",
                                    "problem",
                                    "crisis",
                                ]
                            )
                        ):
                            action_words.append(clean_word)

            if action_words:
                action_counter = Counter(action_words)
                best_action = action_counter.most_common(1)[0][0]
                return f"{entity} {best_action.title()}"

            # Fallback to entity + most common keyword
            if common_keywords:
                return f"{entity} {common_keywords[0][0].title()}"

        # Final fallback - use most descriptive keywords
        if len(common_keywords) >= 3:
            return f"{common_keywords[0][0].title()} {common_keywords[1][0].title()} {common_keywords[2][0].title()}"
        elif len(common_keywords) >= 2:
            return f"{common_keywords[0][0].title()} {common_keywords[1][0].title()}"
        elif len(common_keywords) >= 1:
            return common_keywords[0][0].title()

        # Ultimate fallback - use first headline truncated
        first_headline = headlines[0]["title"]
        return first_headline[:60] + ("..." if len(first_headline) > 60 else "")

    def update_progress(self, message):
        """Updates progress information"""
        print(message, flush=True)

    def run(self, topic=None, last_week=False):
        """Main entry point to run the scraper"""
        if topic and topic not in self.AVAILABLE_TOPICS:
            print(
                json.dumps(
                    {
                        "status": "error",
                        "message": f"Invalid topic. Available topics: {', '.join(self.AVAILABLE_TOPICS)}",
                    }
                )
            )
            return

        try:
            # Scrape data
            if last_week:
                news_data = self.scrape_last_week(topic)
            else:
                news_data = self.scrape_today(topic)

            if not news_data or not news_data.get("sources"):
                print(
                    json.dumps(
                        {
                            "status": "error",
                            "message": "No data found. Please check your internet connection and try again.",
                        }
                    )
                )
                return

            # Store topic information
            if topic:
                news_data["topic"] = topic

            # Find common headlines
            common_topics = self.find_common_headlines(
                news_data, is_topic=bool(topic), is_last_week=last_week
            )

            # Prepare result
            result = {
                "date": news_data.get(
                    "date_range", datetime.now().strftime("%Y-%m-%d")
                ),
                "topic": news_data.get("topic", "all"),
                "is_last_week": last_week,
                "common_topics": common_topics,
                "total_groups": len(common_topics),
                "total_headlines": sum(
                    group.get("count", len(group["headlines"]))
                    for group in common_topics
                ),
            }

            # Output final result as JSON
            print(json.dumps(result))

        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}))


def main():
    """Command-line interface for the Brutalist Report Scraper"""
    parser = argparse.ArgumentParser(description="Enhanced Brutalist Report Scraper")
    parser.add_argument(
        "--topic",
        choices=BrutalistReportScraper.AVAILABLE_TOPICS,
        help="Filter by topic (tech, news, business, science, gaming, culture, politics, sports)",
    )
    parser.add_argument(
        "--last-week",
        action="store_true",
        help="Scrape last week's headlines instead of today's",
    )

    args = parser.parse_args()

    try:
        scraper = BrutalistReportScraper()
        scraper.run(topic=args.topic, last_week=args.last_week)
    except KeyboardInterrupt:
        print(
            json.dumps({"status": "error", "message": "Operation cancelled by user."})
        )
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
